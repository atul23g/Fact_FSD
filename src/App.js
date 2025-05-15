import "./style.css";
import { useEffect, useState } from "react";
import supabase from "./supabase";

const CATEGORIES = [
  { name: "technology", color: "#3b82f6" },
  { name: "science", color: "#16a34a" },
  { name: "finance", color: "#ef4444" },
  { name: "society", color: "#eab308" },
  { name: "entertainment", color: "#db2777" },
  { name: "health", color: "#14b8a6" },
  { name: "history", color: "#f97316" },
  { name: "news", color: "#8b5cf6" },
];

function App() {
  const [currentCategory, setCurrentCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [facts, setFacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [voteFilter, setVoteFilter] = useState("all");

  useEffect(() => {
    async function getFacts() {
      setIsLoading(true);
      const { data: facts, error } = await supabase
        .from("facts")
        .select("*")
        .limit(1000);
      if (!error) setFacts(facts);
      else alert("There was a problem getting data");
      setIsLoading(false);
    }
    getFacts();
  }, []);

  return (
    <>
      <Header 
        showForm={showForm} 
        setShowForm={setShowForm} 
        voteFilter={voteFilter}
        setVoteFilter={setVoteFilter}
      />
      {showForm && (
        <NewFactForm setFacts={setFacts} setShowForm={setShowForm} />
      )}
      <main className="main">
        <CategoryFilters setCurrentCategory={setCurrentCategory} />
        {isLoading ? (
          <Loader />
        ) : (
          <FactList
            currentCategory={currentCategory}
            facts={facts}
            setFacts={setFacts}
            voteFilter={voteFilter}
          />
        )}
      </main>
    </>
  );
}

function Loader() {
  return <p className="message">Loading...</p>;
}

function Header({ showForm, setShowForm, voteFilter, setVoteFilter }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filterOptions = [
    { id: "all", label: "All Facts", icon: "📚" },
    { id: "interesting", label: "Most Interesting", icon: "👍" },
    { id: "mindblowing", label: "Most Mindblowing", icon: "🤯" },
    { id: "false", label: "Most False", icon: "⛔" }
  ];

  const currentFilter = filterOptions.find(option => option.id === voteFilter);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (isDropdownOpen && !event.target.closest('.filter-dropdown')) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <header className="header">
      <div className="logo">
        <img src="logo.png" height="68" width="68" alt="Today I Learned Logo" />
        <h1>Today I Learned</h1>
      </div>
      <div className="header-buttons">
        <div className={`filter-dropdown ${isDropdownOpen ? 'active' : ''}`}>
          <button 
            className="btn btn-filter"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="filter-content">
              <span className="filter-icon">{currentFilter.icon}</span>
              {currentFilter.label}
            </span>
            <span className="dropdown-arrow">▼</span>
          </button>
          {isDropdownOpen && (
            <div className="dropdown-menu">
              {filterOptions.map(option => (
                <button
                  key={option.id}
                  className={`dropdown-item ${voteFilter === option.id ? "active" : ""}`}
                  onClick={() => {
                    setVoteFilter(option.id);
                    setIsDropdownOpen(false);
                  }}
                >
                  <span className="filter-icon">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="btn btn-large btn-open"
          onClick={() => setShowForm((show) => !show)}
        >
          {showForm ? "Close" : "Share a fact"}
        </button>
      </div>
    </header>
  );
}

function isValidHttpUrl(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

function NewFactForm({ setFacts, setShowForm }) {
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const textLength = text.length;

  async function handleSubmit(e) {
    e.preventDefault();
    if (text && isValidHttpUrl(source) && category && textLength <= 200) {
      setIsUploading(true);

      try {
        const { data, error } = await supabase
          .from("facts")
          .insert([
            {
              text,
              source,
              category,
              votes_interesting: 0,
              votes_mindblowing: 0,
              votes_false: 0
            },
          ])
          .select();

        if (error) throw error;

        if (data) {
          setFacts((facts) => [data[0], ...facts]);
          setText("");
          setSource("");
          setCategory("");
          setShowForm(false);
        }
      } catch (error) {
        alert(`Error adding fact: ${error.message}`);
      } finally {
        setIsUploading(false);
      }
    }
  }

  return (
    <form className="fact-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Share a fact with the world..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <span>{200 - textLength}</span>
      <input
        type="text"
        placeholder="Trustworthy source..."
        value={source}
        onChange={(e) => setSource(e.target.value)}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Choose category:</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.name} value={cat.name}>
            {cat.name.toUpperCase()}
          </option>
        ))}
      </select>
      <button
        className="btn btn-large"
        disabled={isUploading || !text || !isValidHttpUrl(source) || !category}
      >
        {isUploading ? "Posting..." : "Post"}
      </button>
    </form>
  );
}

function CategoryFilters({ setCurrentCategory }) {
  return (
    <aside>
      <ul>
        <li className="category">
          <button
            className="btn btn-all-categories"
            onClick={() => setCurrentCategory("all")}
          >
            All
          </button>
        </li>
        {CATEGORIES.map((cat) => (
          <li key={cat.name} className="category">
            <button
              className="btn btn-category"
              onClick={() => setCurrentCategory(cat.name)}
              style={{ backgroundColor: cat.color }}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function FactList({ currentCategory, facts, setFacts, voteFilter }) {
  let filteredFacts =
    currentCategory === "all"
      ? facts
      : facts.filter((fact) => fact.category === currentCategory);

  // Apply vote filter
  if (voteFilter !== "all") {
    filteredFacts = [...filteredFacts].sort((a, b) => {
      const voteType = `votes_${voteFilter}`;
      return b[voteType] - a[voteType];
    });
  }

  if (filteredFacts.length === 0)
    return (
      <p className="message">
        No facts for this category yet! Create the first one.
      </p>
    );

  return (
    <section>
      <ul className="facts-list">
        {filteredFacts.map((fact) => (
          <Fact key={fact.id} fact={fact} setFacts={setFacts} />
        ))}
      </ul>
      <p>
        There are {filteredFacts.length} facts in the database. Add your own!
      </p>
    </section>
  );
}

function Fact({ fact, setFacts }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isDisputed =
    fact.votes_interesting + fact.votes_mindblowing < fact.votes_false;

  async function handleVote(columnName) {
    setIsUpdating(true);
    const { data: updatedFact, error } = await supabase
      .from("facts")
      .update({ [columnName]: (fact[columnName] || 0) + 1 })
      .eq("id", fact.id)
      .select();
    setIsUpdating(false);

    if (error) {
      console.error("Error updating vote:", error);
      alert("There was a problem updating the vote");
    } else if (updatedFact) {
      console.log("Updated fact:", updatedFact[0]);
      setFacts((facts) =>
        facts.map((f) => (f.id === fact.id ? updatedFact[0] : f))
      );
    }
  }

  return (
    <li className="fact">
      <p>
        {isDisputed && <span className="disputed">[⛔ DISPUTED]</span>}
        {fact.text}
        <a
          className="source"
          href={fact.source}
          target="_blank"
          rel="noreferrer"
        >
          (Source)
        </a>
      </p>
      <span
        className="tag"
        style={{
          backgroundColor: CATEGORIES.find((cat) => cat.name === fact.category)
            ?.color,
        }}
      >
        {fact.category}
      </span>
      <div className="vote-buttons">
        <button
          onClick={() => handleVote("votes_interesting")}
          disabled={isUpdating}
        >
          👍 {fact.votes_interesting}
        </button>
        <button
          onClick={() => handleVote("votes_mindblowing")}
          disabled={isUpdating}
        >
          🤯 {fact.votes_mindblowing}
        </button>
        <button onClick={() => handleVote("votes_false")} disabled={isUpdating}>
          ⛔ {fact.votes_false}
        </button>
      </div>
    </li>
  );
}

export default App;
