import { useEffect, useMemo, useState } from "react";
import {
  addAnswer,
  addQuestion,
  analyzeResume,
  createSession,
  getAnalytics,
  getCurrentUser,
  getMatchedMentors,
  getMentors,
  getProgress,
  getQuestions,
  getResumeReviews,
  getSessionsForUser,
  login,
  logout,
  register,
  resetDemoData,
  toggleSavedMentor,
  updateUserPassword,
  updateUserPreferences,
  updateUserProfile,
  updateSessionStatus
} from "./store";

const navItems = ["Home", "Mentors", "Sessions", "Resume", "Progress", "Community", "Dashboard", "Settings", "Auth"];

function Section({ title, subtitle, children, action }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          {subtitle ? <p className="eyebrow">{subtitle}</p> : null}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("Home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authMessage, setAuthMessage] = useState("");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [mentorStatus, setMentorStatus] = useState("");
  const [mentorQuery, setMentorQuery] = useState("");
  const [mentorSkillFilter, setMentorSkillFilter] = useState("all");
  const [mentorView, setMentorView] = useState("all");
  const [sessionForm, setSessionForm] = useState({ mentorId: "", topic: "", agenda: "", scheduledFor: "" });
  const [sessionStatus, setSessionStatus] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("Frontend Developer");
  const [resumeMessage, setResumeMessage] = useState("");
  const [resumeResult, setResumeResult] = useState(null);
  const [communityForm, setCommunityForm] = useState({ title: "", body: "", tags: "career,frontend" });
  const [communityMessage, setCommunityMessage] = useState("");
  const [communityQuery, setCommunityQuery] = useState("");
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [settingsProfile, setSettingsProfile] = useState({
    name: "",
    title: "",
    company: "",
    bio: "",
    skills: "",
    goals: "",
    interests: ""
  });
  const [settingsPreferences, setSettingsPreferences] = useState({
    notifications: true,
    weeklyDigest: true,
    darkCards: false,
    availability: "weekdays",
    theme: "sunrise"
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", nextPassword: "" });
  const [settingsMessage, setSettingsMessage] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    setUser(getCurrentUser());
  }, [version]);

  useEffect(() => {
    if (!user) {
      setSettingsProfile({
        name: "",
        title: "",
        company: "",
        bio: "",
        skills: "",
        goals: "",
        interests: ""
      });
      setSettingsPreferences({
        notifications: true,
        weeklyDigest: true,
        darkCards: false,
        availability: "weekdays",
        theme: "sunrise"
      });
      setPasswordForm({ currentPassword: "", nextPassword: "" });
      return;
    }

    setSettingsProfile({
      name: user.name || "",
      title: user.title || "",
      company: user.company || "",
      bio: user.bio || "",
      skills: (user.skills || []).join(", "),
      goals: (user.goals || []).join(", "),
      interests: (user.interests || []).join(", ")
    });
    setSettingsPreferences({
      notifications: user.preferences?.notifications ?? true,
      weeklyDigest: user.preferences?.weeklyDigest ?? true,
      darkCards: user.preferences?.darkCards ?? false,
      availability: user.preferences?.availability || "weekdays",
      theme: user.preferences?.theme || "sunrise"
    });
    setPasswordForm({ currentPassword: "", nextPassword: "" });
  }, [user]);

  const sessions = useMemo(() => (user ? getSessionsForUser(user) : []), [user, version]);
  const reviews = useMemo(() => (user ? getResumeReviews(user) : []), [user, version]);
  const progress = useMemo(() => (user ? getProgress(user) : null), [user, version]);
  const questions = useMemo(() => getQuestions(), [version]);
  const analytics = useMemo(() => getAnalytics(), [version]);
  const allMentors = useMemo(() => getMentors(), [version]);
  const mentorCards = useMemo(() => {
    if (user?.role === "student" && mentorStatus === "Showing mentors ranked for this student profile.") {
      return getMatchedMentors(user);
    }
    return allMentors;
  }, [allMentors, user, mentorStatus, version]);
  const mentorSkillOptions = useMemo(
    () => ["all", ...new Set(allMentors.flatMap((mentor) => mentor.skills))],
    [allMentors]
  );
  const savedMentorIds = user?.savedMentorIds || [];
  const filteredMentors = useMemo(() => {
    const query = mentorQuery.trim().toLowerCase();
    return mentorCards.filter((mentor) => {
      const matchesQuery = !query || [mentor.name, mentor.title, mentor.company, mentor.bio, ...(mentor.skills || [])]
        .join(" ")
        .toLowerCase()
        .includes(query);
      const matchesSkill = mentorSkillFilter === "all" || mentor.skills.includes(mentorSkillFilter);
      const matchesView = mentorView !== "saved" || savedMentorIds.includes(mentor.id);
      return matchesQuery && matchesSkill && matchesView;
    });
  }, [mentorCards, mentorQuery, mentorSkillFilter, mentorView, savedMentorIds]);
  const filteredQuestions = useMemo(() => {
    const query = communityQuery.trim().toLowerCase();
    if (!query) return questions;
    return questions.filter((question) =>
      [question.title, question.body, ...(question.tags || []), ...question.answers.map((answer) => answer.body)]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [questions, communityQuery]);
  const nextSession = useMemo(() => {
    const now = Date.now();
    return sessions
      .filter((session) => new Date(session.scheduledFor).getTime() >= now)
      .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))[0] || null;
  }, [sessions]);

  function refresh() {
    setVersion((value) => value + 1);
  }

  function handleNavigate(page) {
    setActivePage(page);
    setMobileNavOpen(false);
  }

  function handleResetDemo() {
    resetDemoData();
    setUser(null);
    setActivePage("Home");
    setMobileNavOpen(false);
    setAuthMessage("Demo data reset. Sign in with indhu@student.dev / password123");
    refresh();
  }

  function handleAuthSubmit(event) {
    event.preventDefault();
    try {
      const userResult = authMode === "login" ? login(authForm.email, authForm.password) : register(authForm);
      setUser(userResult);
      setAuthMessage(`${authMode === "login" ? "Logged in" : "Registered"} successfully as ${userResult.role}.`);
      handleNavigate("Home");
      refresh();
    } catch (error) {
      setAuthMessage(error.message);
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
    setAuthMessage("Logged out.");
    setSettingsMessage("");
    setMobileNavOpen(false);
    refresh();
  }

  function handleSaveProfile(event) {
    event.preventDefault();
    if (!user) {
      setSettingsMessage("Sign in first to update your settings.");
      return;
    }

    const updatedUser = updateUserProfile(user.id, {
      name: settingsProfile.name.trim(),
      title: settingsProfile.title.trim(),
      company: settingsProfile.company.trim(),
      bio: settingsProfile.bio.trim(),
      skills: settingsProfile.skills.split(",").map((item) => item.trim()).filter(Boolean),
      goals: settingsProfile.goals.split(",").map((item) => item.trim()).filter(Boolean),
      interests: settingsProfile.interests.split(",").map((item) => item.trim()).filter(Boolean)
    });

    setUser(updatedUser);
    setSettingsMessage("Profile settings saved locally.");
    refresh();
  }

  function handleSavePreferences(event) {
    event.preventDefault();
    if (!user) {
      setSettingsMessage("Sign in first to update your settings.");
      return;
    }

    const updatedUser = updateUserPreferences(user.id, settingsPreferences);
    setUser(updatedUser);
    setSettingsMessage("Preferences updated locally.");
    refresh();
  }

  function handleChangePassword(event) {
    event.preventDefault();
    if (!user) {
      setSettingsMessage("Sign in first to update your password.");
      return;
    }

    try {
      updateUserPassword(user.id, passwordForm.currentPassword, passwordForm.nextPassword);
      setPasswordForm({ currentPassword: "", nextPassword: "" });
      setSettingsMessage("Password updated locally.");
      refresh();
    } catch (error) {
      setSettingsMessage(error.message);
    }
  }

  function showMatches() {
    if (!user || user.role !== "student") {
      setMentorStatus("Sign in as a student to view mentor matches.");
      return;
    }
    setMentorView("all");
    setMentorStatus("Showing mentors ranked for this student profile.");
  }

  function handleToggleSavedMentor(mentorId) {
    if (!user || user.role !== "student") {
      setMentorStatus("Sign in as a student to save mentors.");
      return;
    }
    const updatedUser = toggleSavedMentor(user.id, mentorId);
    setUser(updatedUser);
    setMentorStatus(
      updatedUser.savedMentorIds.includes(mentorId)
        ? "Mentor saved to your shortlist."
        : "Mentor removed from your shortlist."
    );
    refresh();
  }

  function handleCreateSession(event) {
    event.preventDefault();
    if (!user) {
      setSessionStatus("Sign in first.");
      return;
    }
    createSession(user, sessionForm);
    setSessionForm({ mentorId: "", topic: "", agenda: "", scheduledFor: "" });
    setSessionStatus("Session created locally.");
    refresh();
  }

  function handleAnalyzeResume() {
    if (!user) {
      setResumeMessage("Sign in first.");
      return;
    }
    const review = analyzeResume(user, resumeText, targetRole);
    setResumeResult(review);
    setResumeMessage("Resume review saved locally.");
    refresh();
  }

  function handleSubmitQuestion(event) {
    event.preventDefault();
    if (!user) {
      setCommunityMessage("Sign in first.");
      return;
    }
    addQuestion(user, {
      title: communityForm.title,
      body: communityForm.body,
      tags: communityForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
    });
    setCommunityForm({ title: "", body: "", tags: "career,frontend" });
    setCommunityMessage("Question saved locally.");
    refresh();
  }

  function handleSubmitAnswer(questionId) {
    if (!user) {
      setCommunityMessage("Sign in first.");
      return;
    }
    addAnswer(user, questionId, answerDrafts[questionId] || "");
    setAnswerDrafts((current) => ({ ...current, [questionId]: "" }));
    setCommunityMessage("Answer saved locally.");
    refresh();
  }

  const activeTheme = user ? settingsPreferences.theme : "sunrise";
  const compactMode = user ? settingsPreferences.darkCards : false;

  return (
    <div className={`app-shell theme-${activeTheme} ${compactMode ? "compact-mode" : ""}`}>
      <header className="topbar">
        <div className="topbar-row">
          <div className="brand">MentorBridge</div>
          <button
            className={`hamburger ${mobileNavOpen ? "open" : ""}`}
            onClick={() => setMobileNavOpen((current) => !current)}
            aria-label="Toggle navigation"
            aria-expanded={mobileNavOpen}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <nav className={`nav ${mobileNavOpen ? "nav-open" : ""}`}>
          {navItems.map((item) => (
            <button key={item} className={activePage === item ? "nav-link active" : "nav-link"} onClick={() => handleNavigate(item)}>
              {item}
            </button>
          ))}
        </nav>
        <div className="user-box">
          {user ? (
            <>
              <span>{user.name} - {user.role}</span>
              <button className="button ghost" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="button dark" onClick={() => handleNavigate("Auth")}>Sign in</button>
          )}
        </div>
      </header>

      <main className="container">
        {activePage === "Home" && (
          <>
            <section className="hero">
              <div className="hero-main">
                <p className="eyebrow">Career mentorship platform</p>
                <h1>Find the right mentor and turn career plans into momentum.</h1>
                <p>
                  MentorBridge is now built with plain React, JavaScript, HTML structure, and CSS only.
                  It helps students connect with mentors, book sessions, review resumes, track progress, and learn through a community forum.
                </p>
                <div className="hero-actions">
                  <button className="button dark" onClick={() => handleNavigate("Mentors")}>Explore Mentors</button>
                  <button className="button" onClick={handleResetDemo}>Reset Demo Data</button>
                </div>
              </div>
              <div className="hero-side">
                <div className="mini-card"><strong>Smart matching</strong><span>Pair students with mentors using goals, interests, and skill overlap.</span></div>
                <div className="mini-card"><strong>Resume review</strong><span>Generate local role-aware suggestions and save review history.</span></div>
                <div className="mini-card"><strong>Zero backend</strong><span>Everything runs in the browser with React and localStorage.</span></div>
              </div>
            </section>
            <section className="stats-grid">
              {[
                ["Mentors Available", analytics.mentors],
                ["Sessions", analytics.sessions],
                ["Resume Reviews", analytics.reviews],
                ["Questions", analytics.questions]
              ].map(([label, value]) => (
                <div key={label} className="stat-card">
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </section>
            <section className="two-column">
              <div className="panel spotlight-panel">
                <p className="eyebrow">Quick pulse</p>
                <h2>Your next move</h2>
                {user ? (
                  <div className="stack">
                    <div className="note">
                      <strong>Saved mentors</strong>
                      <span>{savedMentorIds.length} mentors shortlisted for follow-up.</span>
                    </div>
                    <div className="note">
                      <strong>Next session</strong>
                      <span>
                        {nextSession
                          ? `${nextSession.topic} with ${nextSession.mentor?.name || nextSession.student?.name || "your mentor"} on ${new Date(nextSession.scheduledFor).toLocaleString()}`
                          : "No upcoming sessions yet. Book one from the sessions tab."}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="message">Sign in to save mentors, track sessions, and get a personalized dashboard snapshot.</p>
                )}
              </div>
              <div className="panel spotlight-panel">
                <p className="eyebrow">Momentum builder</p>
                <h2>What feels new</h2>
                <div className="stack">
                  <div className="note"><strong>Mentor shortlist</strong><span>Save mentors you want to revisit later.</span></div>
                  <div className="note"><strong>Directory filters</strong><span>Search by skill, company, or mentor role.</span></div>
                  <div className="note"><strong>Community search</strong><span>Find answers faster across posts and replies.</span></div>
                </div>
              </div>
            </section>
          </>
        )}

        {activePage === "Mentors" && (
          <Section title="Mentor Directory" subtitle="Matching and discovery" action={user?.role === "student" ? <button className="button accent" onClick={showMatches}>Find My Matches</button> : null}>
            {mentorStatus ? <p className="message">{mentorStatus}</p> : null}
            <div className="filter-bar">
              <input
                value={mentorQuery}
                onChange={(e) => setMentorQuery(e.target.value)}
                placeholder="Search mentors, companies, skills, or roles"
              />
              <select value={mentorSkillFilter} onChange={(e) => setMentorSkillFilter(e.target.value)}>
                {mentorSkillOptions.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill === "all" ? "All skills" : skill}
                  </option>
                ))}
              </select>
              <select value={mentorView} onChange={(e) => setMentorView(e.target.value)}>
                <option value="all">All mentors</option>
                <option value="saved">Saved mentors</option>
              </select>
            </div>
            <div className="list-summary">
              <span>{filteredMentors.length} mentors shown</span>
              {(mentorQuery || mentorSkillFilter !== "all" || mentorView !== "all") ? (
                <button
                  className="button ghost"
                  onClick={() => {
                    setMentorQuery("");
                    setMentorSkillFilter("all");
                    setMentorView("all");
                  }}
                >
                  Clear filters
                </button>
              ) : null}
            </div>
            <div className="card-grid">
              {filteredMentors.map((mentor) => (
                <article key={mentor.id} className="card">
                  <p className="small-label">{mentor.company}</p>
                  <h3>{mentor.name}</h3>
                  <p className="accent-text">{mentor.title}</p>
                  <p>{mentor.bio}</p>
                  <div className="chip-row">
                    {mentor.skills.slice(0, 4).map((skill) => <span key={skill} className="chip">{skill}</span>)}
                  </div>
                  <div className="meta-row">
                    <span>Rating: {mentor.averageRating?.toFixed(1) || "New"}</span>
                    <span>{mentor.reviewCount || 0} reviews</span>
                  </div>
                  {typeof mentor.matchScore === "number" ? <p className="match-text">Match score: {mentor.matchScore}</p> : null}
                  <div className="inline-actions">
                    <button className="button dark" onClick={() => handleNavigate("Sessions")}>Book Session</button>
                    <button className={savedMentorIds.includes(mentor.id) ? "button accent" : "button"} onClick={() => handleToggleSavedMentor(mentor.id)}>
                      {savedMentorIds.includes(mentor.id) ? "Saved" : "Save mentor"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {!filteredMentors.length ? <p className="message">No mentors match these filters yet.</p> : null}
          </Section>
        )}

        {activePage === "Sessions" && (
          <div className="two-column">
            <Section title="Book a Session" subtitle="Career guidance">
              {user?.role === "student" ? (
                <form className="form-stack" onSubmit={handleCreateSession}>
                  <select value={sessionForm.mentorId} onChange={(e) => setSessionForm({ ...sessionForm, mentorId: e.target.value })}>
                    <option value="">Select mentor</option>
                    {getMentors().map((mentor) => <option key={mentor.id} value={mentor.id}>{mentor.name} - {mentor.title}</option>)}
                  </select>
                  <input value={sessionForm.topic} onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })} placeholder="Session topic" />
                  <textarea value={sessionForm.agenda} onChange={(e) => setSessionForm({ ...sessionForm, agenda: e.target.value })} placeholder="Agenda or discussion points" />
                  <input type="datetime-local" value={sessionForm.scheduledFor} onChange={(e) => setSessionForm({ ...sessionForm, scheduledFor: e.target.value })} />
                  <button className="button dark" type="submit">Schedule Session</button>
                </form>
              ) : <p className="message">Students can book mentorship sessions here after signing in.</p>}
              {sessionStatus ? <p className="message">{sessionStatus}</p> : null}
            </Section>
            <Section title="Upcoming Sessions" subtitle="Schedule">
              <div className="stack">
                {sessions.length ? sessions.map((session) => (
                  <div className="card" key={session.id}>
                    <p className="small-label">{session.status}</p>
                    <h3>{session.topic}</h3>
                    <p>Student: {session.student?.name || "Unknown"} - Mentor: {session.mentor?.name || "Unknown"}</p>
                    <p>{session.agenda}</p>
                    <p>{new Date(session.scheduledFor).toLocaleString()}</p>
                    <div className="inline-actions">
                      <button className="button" onClick={() => { updateSessionStatus(session.id, "confirmed"); refresh(); }}>Confirm</button>
                      <button className="button ghost" onClick={() => { updateSessionStatus(session.id, "completed"); refresh(); }}>Complete</button>
                    </div>
                  </div>
                )) : <p className="message">No sessions yet. Reset demo data or create your first booking.</p>}
              </div>
            </Section>
          </div>
        )}

        {activePage === "Resume" && (
          <div className="two-column">
            <Section title="Resume Review" subtitle="Career documents">
              <div className="form-stack">
                <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Target role" />
                <textarea className="tall-textarea" value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste resume text here..." />
                <button className="button accent" onClick={handleAnalyzeResume}>Analyze Resume</button>
                {resumeMessage ? <p className="message">{resumeMessage}</p> : null}
              </div>
            </Section>
            <Section title="Feedback Panel" subtitle="Saved locally">
              {resumeResult ? (
                <>
                  <div className="score">{resumeResult.score}/100</div>
                  <div className="stack">
                    {resumeResult.feedback.map((item) => <div className="note" key={item}>{item}</div>)}
                  </div>
                </>
              ) : <p className="message">Submit a resume to generate suggestions.</p>}
              <h3 className="subheading">Review History</h3>
              <div className="stack">
                {reviews.length ? reviews.map((review) => (
                  <div className="card compact" key={review.id}>
                    <strong>{review.targetRole || "General review"}</strong>
                    <span>Score: {review.score}/100</span>
                  </div>
                )) : <p className="message">No saved reviews yet.</p>}
              </div>
            </Section>
          </div>
        )}

        {activePage === "Progress" && (
          <div className="two-column">
            <Section title="Growth Snapshot" subtitle="Progress tracking">
              {progress ? (
                <div className="stats-grid">
                  {[
                    ["Profile Strength", `${progress.profileStrength}%`],
                    ["Applications Sent", progress.applicationsSent],
                    ["Interviews Completed", progress.interviewsCompleted],
                    ["Milestones", progress.milestones.length]
                  ].map(([label, value]) => (
                    <div className="stat-card" key={label}>
                      <div className="stat-value">{value}</div>
                      <div className="stat-label">{label}</div>
                    </div>
                  ))}
                </div>
              ) : <p className="message">Sign in as a student to view progress.</p>}
            </Section>
            <Section title="Milestones" subtitle="Action plan">
              <div className="stack">
                {progress?.milestones?.length ? progress.milestones.map((milestone) => (
                  <div className="milestone" key={milestone.title}>
                    <span>{milestone.title}</span>
                    <span className={milestone.completed ? "status done" : "status pending"}>
                      {milestone.completed ? "Completed" : "In Progress"}
                    </span>
                  </div>
                )) : <p className="message">No progress data yet.</p>}
              </div>
            </Section>
          </div>
        )}

        {activePage === "Community" && (
          <div className="two-column">
            <Section title="Ask the Community" subtitle="Forum">
              <form className="form-stack" onSubmit={handleSubmitQuestion}>
                <input value={communityForm.title} onChange={(e) => setCommunityForm({ ...communityForm, title: e.target.value })} placeholder="Question title" />
                <textarea value={communityForm.body} onChange={(e) => setCommunityForm({ ...communityForm, body: e.target.value })} placeholder="Describe your question" />
                <input value={communityForm.tags} onChange={(e) => setCommunityForm({ ...communityForm, tags: e.target.value })} placeholder="Comma-separated tags" />
                <button className="button dark" type="submit">Post Question</button>
                {communityMessage ? <p className="message">{communityMessage}</p> : null}
              </form>
            </Section>
            <Section title="Community Feed" subtitle="Questions and answers">
              <div className="filter-bar">
                <input
                  value={communityQuery}
                  onChange={(e) => setCommunityQuery(e.target.value)}
                  placeholder="Search questions, tags, or answers"
                />
              </div>
              <div className="stack">
                {filteredQuestions.map((question) => (
                  <div className="card" key={question.id}>
                    <h3>{question.title}</h3>
                    <p>{question.body}</p>
                    <p className="small-label">{question.tags.join(" - ")}</p>
                    <div className="stack">
                      {question.answers.map((answer) => (
                        <div className="note" key={answer.id}>
                          <strong>{answer.authorName}</strong>
                          <span>{answer.body}</span>
                        </div>
                      ))}
                    </div>
                    <textarea value={answerDrafts[question.id] || ""} onChange={(e) => setAnswerDrafts({ ...answerDrafts, [question.id]: e.target.value })} placeholder="Write an answer" />
                    <button className="button" onClick={() => handleSubmitAnswer(question.id)}>Add Answer</button>
                  </div>
                ))}
              </div>
              {!filteredQuestions.length ? <p className="message">No community posts match your search.</p> : null}
            </Section>
          </div>
        )}

        {activePage === "Dashboard" && (
          <Section title="Platform Dashboard" subtitle="Frontend-only analytics">
            <div className="stats-grid">
              {[
                ["Students", analytics.students],
                ["Mentors", analytics.mentors],
                ["Sessions", analytics.sessions],
                ["Engagement Rate", `${analytics.engagementRate}%`],
                ["Resume Reviews", analytics.reviews],
                ["Community Questions", analytics.questions]
              ].map(([label, value]) => (
                <div className="stat-card" key={label}>
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {activePage === "Settings" && (
          user ? (
            <div className="settings-layout">
              <Section title="Profile Settings" subtitle="Personal information">
                <form className="form-stack" onSubmit={handleSaveProfile}>
                  <input value={settingsProfile.name} onChange={(e) => setSettingsProfile({ ...settingsProfile, name: e.target.value })} placeholder="Full name" />
                  <input value={settingsProfile.title} onChange={(e) => setSettingsProfile({ ...settingsProfile, title: e.target.value })} placeholder="Professional title" />
                  <input value={settingsProfile.company} onChange={(e) => setSettingsProfile({ ...settingsProfile, company: e.target.value })} placeholder="Company or campus" />
                  <textarea value={settingsProfile.bio} onChange={(e) => setSettingsProfile({ ...settingsProfile, bio: e.target.value })} placeholder="Short bio" />
                  <input value={settingsProfile.skills} onChange={(e) => setSettingsProfile({ ...settingsProfile, skills: e.target.value })} placeholder="Skills separated by commas" />
                  <input value={settingsProfile.goals} onChange={(e) => setSettingsProfile({ ...settingsProfile, goals: e.target.value })} placeholder="Goals separated by commas" />
                  <input value={settingsProfile.interests} onChange={(e) => setSettingsProfile({ ...settingsProfile, interests: e.target.value })} placeholder="Interests separated by commas" />
                  <button className="button dark" type="submit">Save Profile</button>
                </form>
              </Section>

              <Section title="App Preferences" subtitle="Notifications and availability">
                <form className="form-stack" onSubmit={handleSavePreferences}>
                  <div className="theme-row">
                    <span>
                      <strong>Theme</strong>
                      <small>Choose the overall look of the platform.</small>
                    </span>
                    <select value={settingsPreferences.theme} onChange={(e) => setSettingsPreferences({ ...settingsPreferences, theme: e.target.value })}>
                      <option value="sunrise">Sunrise</option>
                      <option value="forest">Forest</option>
                      <option value="midnight">Midnight</option>
                    </select>
                  </div>
                  <label className="toggle-row">
                    <span>
                      <strong>Mentor notifications</strong>
                      <small>Get alerts for new sessions and community replies.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={settingsPreferences.notifications}
                      onChange={(e) => setSettingsPreferences({ ...settingsPreferences, notifications: e.target.checked })}
                    />
                  </label>
                  <label className="toggle-row">
                    <span>
                      <strong>Weekly digest</strong>
                      <small>Receive a local summary of pending actions and activity.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={settingsPreferences.weeklyDigest}
                      onChange={(e) => setSettingsPreferences({ ...settingsPreferences, weeklyDigest: e.target.checked })}
                    />
                  </label>
                  <label className="toggle-row">
                    <span>
                      <strong>Compact cards</strong>
                      <small>Use a denser content layout for dashboard cards.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={settingsPreferences.darkCards}
                      onChange={(e) => setSettingsPreferences({ ...settingsPreferences, darkCards: e.target.checked })}
                    />
                  </label>
                  <select value={settingsPreferences.availability} onChange={(e) => setSettingsPreferences({ ...settingsPreferences, availability: e.target.value })}>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekends">Weekends</option>
                    <option value="evenings">Evenings</option>
                    <option value="flexible">Flexible</option>
                  </select>
                  <button className="button accent" type="submit">Save Preferences</button>
                </form>
              </Section>

              <Section title="Account Security" subtitle="Password and account state">
                <form className="form-stack" onSubmit={handleChangePassword}>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Current password"
                  />
                  <input
                    type="password"
                    value={passwordForm.nextPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, nextPassword: e.target.value })}
                    placeholder="New password"
                  />
                  <button className="button" type="submit">Update Password</button>
                </form>
                <div className="settings-summary">
                  <div className="note">
                    <strong>Signed in as</strong>
                    <span>{user.email}</span>
                  </div>
                  <div className="note">
                    <strong>Role</strong>
                    <span>{user.role}</span>
                  </div>
                </div>
                {settingsMessage ? <p className="message">{settingsMessage}</p> : null}
              </Section>
            </div>
          ) : (
            <Section title="Settings" subtitle="Account required">
              <p className="message">Sign in to manage your profile, preferences, and account security.</p>
              <button className="button dark" onClick={() => handleNavigate("Auth")}>Go to Sign In</button>
            </Section>
          )
        )}

        {activePage === "Auth" && (
          <div className="two-column">
            <Section title="Authentication" subtitle="Local account access">
              <p className="message">This version stores demo accounts and session state in browser localStorage.</p>
              <div className="inline-actions">
                <button className={authMode === "login" ? "button dark" : "button"} onClick={() => setAuthMode("login")}>Login</button>
                <button className={authMode === "register" ? "button accent" : "button"} onClick={() => setAuthMode("register")}>Register</button>
              </div>
            </Section>
            <Section title={authMode === "login" ? "Sign In" : "Create Account"} subtitle="Form">
              <form className="form-stack" onSubmit={handleAuthSubmit}>
                {authMode === "register" ? <input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Full name" /> : null}
                <input value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="Email" type="email" />
                <input value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="Password" type="password" />
                {authMode === "register" ? (
                  <select value={authForm.role} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}>
                    <option value="student">Student</option>
                    <option value="mentor">Mentor</option>
                  </select>
                ) : null}
                <button className="button dark" type="submit">{authMode === "login" ? "Login" : "Register"}</button>
                {authMessage ? <p className="message">{authMessage}</p> : null}
              </form>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}
