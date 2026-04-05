const STORAGE_KEY = "mentorbridge_state";
const TOKEN_KEY = "mentorbridge_token";
const defaultPreferences = {
  notifications: true,
  weeklyDigest: true,
  darkCards: false,
  availability: "weekdays",
  theme: "sunrise"
};

const defaultState = {
  users: [
    {
      id: "student-indhu",
      name: "Indhu",
      email: "indhu@student.dev",
      password: "password123",
      role: "student",
      title: "Final Year CSE Student",
      company: "MentorBridge Campus",
      bio: "Preparing for frontend and product opportunities with a focus on mentorship-driven growth.",
      skills: ["HTML", "CSS", "JavaScript"],
      goals: ["React", "JavaScript", "Product Strategy"],
      interests: ["frontend", "product", "design systems"]
    },
    {
      id: "mentor-aarav",
      name: "Aarav Menon",
      email: "aarav@mentorbridge.dev",
      password: "password123",
      role: "mentor",
      title: "Senior Frontend Engineer",
      company: "PixelForge",
      bio: "Helps students break into frontend and UI engineering roles with portfolio and interview coaching.",
      skills: ["React", "JavaScript", "HTML", "CSS"],
      interests: ["frontend", "product", "design systems"],
      averageRating: 4.9,
      reviewCount: 18
    },
    {
      id: "mentor-nisha",
      name: "Nisha Kapoor",
      email: "nisha@mentorbridge.dev",
      password: "password123",
      role: "mentor",
      title: "Product Manager",
      company: "Northstar Labs",
      bio: "Guides aspiring PMs on product thinking, case interviews, and cross-functional collaboration.",
      skills: ["Product Strategy", "Roadmapping", "Analytics", "Stakeholder Management"],
      interests: ["product", "growth", "startups"],
      averageRating: 4.8,
      reviewCount: 14
    },
    {
      id: "mentor-rohan",
      name: "Rohan Iyer",
      email: "rohan@mentorbridge.dev",
      password: "password123",
      role: "mentor",
      title: "Backend Engineer",
      company: "CloudMesh",
      bio: "Supports early-career developers with Node.js, API design, and system design basics.",
      skills: ["Node.js", "JavaScript", "APIs", "System Design"],
      interests: ["backend", "cloud", "scalability"],
      averageRating: 4.7,
      reviewCount: 11
    }
  ],
  sessions: [
    {
      id: "session-1",
      studentId: "student-indhu",
      mentorId: "mentor-aarav",
      topic: "Portfolio Review",
      agenda: "Review projects and improve storytelling for frontend interviews.",
      scheduledFor: "2026-04-05T17:00",
      status: "confirmed"
    },
    {
      id: "session-2",
      studentId: "student-indhu",
      mentorId: "mentor-nisha",
      topic: "Breaking into Product",
      agenda: "Discuss product case prep and roadmap thinking.",
      scheduledFor: "2026-04-09T13:30",
      status: "pending"
    }
  ],
  progressByUser: {
    "student-indhu": {
      profileStrength: 82,
      applicationsSent: 14,
      interviewsCompleted: 3,
      milestones: [
        { title: "Complete profile", completed: true },
        { title: "Book first mentor session", completed: true },
        { title: "Refine resume for target role", completed: false },
        { title: "Apply to 10 companies", completed: false }
      ]
    }
  },
  resumeReviewsByUser: {
    "student-indhu": [
      {
        id: "review-1",
        targetRole: "Frontend Developer",
        score: 84,
        feedback: [
          "Add one project with stronger product impact language.",
          "Expand metrics for collaboration and performance improvements."
        ]
      }
    ]
  },
  questions: [
    {
      id: "question-1",
      title: "How can I make my frontend portfolio feel more production-ready?",
      body: "I have a few student projects but I want them to look stronger to recruiters. What should I add?",
      tags: ["frontend", "portfolio"],
      answers: [
        {
          id: "answer-1",
          authorName: "Aarav Menon",
          body: "Add deployment links, measurable impact, accessibility notes, and a short tradeoff section for each project."
        }
      ]
    },
    {
      id: "question-2",
      title: "What should I prepare before my first product mentorship session?",
      body: "I want to make the most of the conversation. What should I bring?",
      tags: ["product", "mentorship"],
      answers: [
        {
          id: "answer-2",
          authorName: "Nisha Kapoor",
          body: "Bring one career goal, one product case question, one blocker, and one action you can commit to this week."
        }
      ]
    }
  ]
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeState(state) {
  return {
    ...state,
    users: (state.users || []).map((user) => ({
      ...user,
      savedMentorIds: Array.isArray(user.savedMentorIds) ? user.savedMentorIds : [],
      preferences: {
        ...defaultPreferences,
        ...(user.preferences || {})
      }
    }))
  };
}

export function getState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initialState = normalizeState(clone(defaultState));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
    return initialState;
  }
  const parsed = normalizeState(JSON.parse(stored));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  return parsed;
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetDemoData() {
  saveState(clone(defaultState));
  localStorage.removeItem(TOKEN_KEY);
  return clone(defaultState);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  return getState().users.find((user) => user.id === token) || null;
}

export function login(email, password) {
  const user = getState().users.find((item) => item.email === email && item.password === password);
  if (!user) throw new Error("Invalid credentials");
  setToken(user.id);
  return user;
}

export function register(form) {
  const state = getState();
  const exists = state.users.some((user) => user.email.toLowerCase() === form.email.toLowerCase());
  if (exists) throw new Error("User already exists");

  const user = {
    id: `user-${Date.now()}`,
    name: form.name,
    email: form.email,
    password: form.password,
    role: form.role,
    title: form.role === "mentor" ? "Career Mentor" : "Student",
    company: "MentorBridge",
    bio: "",
    skills: [],
    goals: [],
    interests: [],
    savedMentorIds: [],
    preferences: { ...defaultPreferences }
  };

  state.users.push(user);
  if (user.role === "student") {
    state.progressByUser[user.id] = {
      profileStrength: 40,
      applicationsSent: 0,
      interviewsCompleted: 0,
      milestones: [
        { title: "Complete profile", completed: false },
        { title: "Book first mentor session", completed: false }
      ]
    };
    state.resumeReviewsByUser[user.id] = [];
  }

  saveState(state);
  setToken(user.id);
  return user;
}

export function logout() {
  clearToken();
}

export function updateUserProfile(userId, updates) {
  const state = getState();
  state.users = state.users.map((user) =>
    user.id === userId
      ? {
          ...user,
          ...updates,
          skills: Array.isArray(updates.skills) ? updates.skills : user.skills,
          goals: Array.isArray(updates.goals) ? updates.goals : user.goals,
          interests: Array.isArray(updates.interests) ? updates.interests : user.interests
        }
      : user
  );
  saveState(state);
  return state.users.find((user) => user.id === userId) || null;
}

export function updateUserPreferences(userId, preferences) {
  const state = getState();
  state.users = state.users.map((user) =>
    user.id === userId
      ? {
          ...user,
          preferences: {
            ...defaultPreferences,
            ...(user.preferences || {}),
            ...preferences
          }
        }
      : user
  );
  saveState(state);
  return state.users.find((user) => user.id === userId) || null;
}

export function updateUserPassword(userId, currentPassword, nextPassword) {
  const state = getState();
  const user = state.users.find((item) => item.id === userId);
  if (!user) throw new Error("User not found");
  if (user.password !== currentPassword) throw new Error("Current password is incorrect");

  state.users = state.users.map((item) =>
    item.id === userId ? { ...item, password: nextPassword } : item
  );
  saveState(state);
}

export function getMentors() {
  return getState().users.filter((user) => user.role === "mentor");
}

export function getMatchedMentors(user) {
  return getMentors()
    .map((mentor) => {
      const skillOverlap = mentor.skills.filter(
        (skill) => user.goals?.includes(skill) || user.interests?.includes(skill)
      ).length;
      const interestOverlap = mentor.interests.filter((interest) => user.interests?.includes(interest)).length;
      return { ...mentor, matchScore: skillOverlap * 2 + interestOverlap };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function toggleSavedMentor(userId, mentorId) {
  const state = getState();
  state.users = state.users.map((user) => {
    if (user.id !== userId) return user;
    const savedMentorIds = user.savedMentorIds?.includes(mentorId)
      ? user.savedMentorIds.filter((id) => id !== mentorId)
      : [...(user.savedMentorIds || []), mentorId];

    return { ...user, savedMentorIds };
  });
  saveState(state);
  return state.users.find((user) => user.id === userId) || null;
}

export function getSessionsForUser(user) {
  const state = getState();
  return state.sessions
    .filter((session) => session.studentId === user.id || session.mentorId === user.id)
    .map((session) => ({
      ...session,
      student: state.users.find((item) => item.id === session.studentId),
      mentor: state.users.find((item) => item.id === session.mentorId)
    }));
}

export function createSession(user, form) {
  const state = getState();
  state.sessions.push({
    id: `session-${Date.now()}`,
    studentId: user.id,
    mentorId: form.mentorId,
    topic: form.topic,
    agenda: form.agenda,
    scheduledFor: form.scheduledFor,
    status: "pending"
  });
  saveState(state);
}

export function updateSessionStatus(id, status) {
  const state = getState();
  state.sessions = state.sessions.map((session) => (session.id === id ? { ...session, status } : session));
  saveState(state);
}

export function analyzeResume(user, resumeText, targetRole) {
  const feedback = [];
  const lower = resumeText.toLowerCase();
  if (!lower.includes("project")) feedback.push("Add stronger project bullets with visible impact.");
  if (!resumeText.includes("%")) feedback.push("Quantify outcomes using percentages, counts, or time saved.");
  if (!lower.includes("skills")) feedback.push("Include a focused skills section aligned to the role.");
  if (targetRole) feedback.push(`Tailor your summary and experience toward ${targetRole}.`);

  const review = {
    id: `review-${Date.now()}`,
    targetRole,
    score: Math.max(60, 94 - feedback.length * 7),
    feedback: feedback.length ? feedback : ["Your resume is in strong shape. Add a few more metrics to stand out."]
  };

  const state = getState();
  state.resumeReviewsByUser[user.id] = [review, ...(state.resumeReviewsByUser[user.id] || [])];
  saveState(state);
  return review;
}

export function getResumeReviews(user) {
  return getState().resumeReviewsByUser[user.id] || [];
}

export function getProgress(user) {
  return getState().progressByUser[user.id] || null;
}

export function getQuestions() {
  return getState().questions;
}

export function addQuestion(user, form) {
  const state = getState();
  state.questions.unshift({
    id: `question-${Date.now()}`,
    title: form.title,
    body: form.body,
    tags: form.tags,
    answers: [
      {
        id: `answer-${Date.now()}`,
        authorName: "MentorBridge",
        body: "Thanks for starting the discussion. A mentor or peer can answer this next."
      }
    ]
  });
  saveState(state);
}

export function addAnswer(user, questionId, body) {
  const state = getState();
  state.questions = state.questions.map((question) =>
    question.id === questionId
      ? {
          ...question,
          answers: [...question.answers, { id: `answer-${Date.now()}`, authorName: user.name, body }]
        }
      : question
  );
  saveState(state);
}

export function getAnalytics() {
  const state = getState();
  const students = state.users.filter((user) => user.role === "student").length;
  const mentors = state.users.filter((user) => user.role === "mentor").length;
  const sessions = state.sessions.length;
  const completedSessions = state.sessions.filter((session) => session.status === "completed").length;
  const reviews = Object.values(state.resumeReviewsByUser).reduce((sum, items) => sum + items.length, 0);
  const questions = state.questions.length;

  return {
    students,
    mentors,
    sessions,
    completedSessions,
    reviews,
    questions,
    engagementRate: sessions ? Math.round((completedSessions / sessions) * 100) : 0
  };
}
