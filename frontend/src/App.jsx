import { useState, useEffect } from "react";
import "./App.css";
import LandingPage from "./components/landingPage";
import HomePage from "./components/homePage";
import SearchPage from "./components/searchPage";
import AttractionPage from "./components/attractionPage";
import CompilationPage from "./components/compilationPage";

const API_URL = "http://127.0.0.1:8000/api";

function App() {
  const [view, setView] = useState("landing");
  const [userProfile, setUserProfile] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [savedAttractions, setSavedAttractions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalBudget, setTotalBudget] = useState(0);

  useEffect(() => {
    fetchCountries();
    loadProfileFromStorage();
  }, []);

  useEffect(() => {
    calculateTotalBudget();
  }, [savedAttractions]);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/countries/`);
      const data = await response.json();
      setCountries(data.results || data);
    } catch (err) {
      console.error("Erreur lors du chargement des pays:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadProfileFromStorage = () => {
    const savedProfile = localStorage.getItem("userProfile");
    const savedCountryId = localStorage.getItem("selectedCountry");
    const savedAttractionsList = localStorage.getItem("savedAttractions");

    if (savedProfile && savedCountryId) {
      setUserProfile(savedProfile);

      const foundCountry = countries.find(
        (c) => c.id === parseInt(savedCountryId)
      );
      if (foundCountry) {
        setSelectedCountry(foundCountry);
        setView("home");
      }
    }

    if (savedAttractionsList) {
      try {
        const attractions = JSON.parse(savedAttractionsList);
        setSavedAttractions(attractions);
      } catch (err) {
        console.error("Erreur lors du chargement des attractions:", err);
      }
    }
  };

  const fetchTripAdvisorAttractions = async (country) => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `${API_URL}/countries/${country.id}/search_tripadvisor/`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        console.log(`${data.length} attractions TripAdvisor récupérées pour ${country.name}`);
        for (var item in data){
          const response = await fetch(
        `${API_URL}/attractions/${item}/details_from_tripadvisor/`
      );
        }
      }
    } catch (err) {
      console.error("Erreur lors de la récupération TripAdvisor:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSetup = async (profile, country) => {
    setUserProfile(profile);
    setSelectedCountry(country);
    localStorage.setItem("userProfile", profile);
    localStorage.setItem("selectedCountry", country.id);
    
    await fetchTripAdvisorAttractions(country);
    
    setView("home");
  };

  const handleSelectAttraction = (attractionId) => {
    fetch(`${API_URL}/attractions/${attractionId}/`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedAttraction(data);
        setView("attraction");
      })
      .catch((err) => console.error("Erreur attraction:", err))
      .finally(() => setLoading(false));
  };

  const handleSaveAttraction = (attraction) => {
    setSavedAttractions((prevAttractions) => {
      let newAttractions;

      if (prevAttractions.find((a) => a.id === attraction.id)) {
        newAttractions = prevAttractions.filter(
          (a) => a.id !== attraction.id
        );
      } else {
        newAttractions = [...prevAttractions, attraction];
      }

      localStorage.setItem(
        "savedAttractions",
        JSON.stringify(newAttractions)
      );

      return newAttractions;
    });
  };

  const handleRemoveAttraction = (attractionId) => {
    setSavedAttractions((prevAttractions) => {
      const newAttractions = prevAttractions.filter(
        (a) => a.id !== attractionId
      );
      localStorage.setItem(
        "savedAttractions",
        JSON.stringify(newAttractions)
      );
      return newAttractions;
    });
  };

  const calculateTotalBudget = () => {
    const priceMap = {
      free: 0,
      budget: 10,
      moderate: 25,
      expensive: 50,
      luxury: 100,
    };

    const total = savedAttractions.reduce((sum, attr) => {
      return sum + (priceMap[attr.price_level] || 0);
    }, 0);

    setTotalBudget(total);
  };

  const resetProfile = () => {
    localStorage.removeItem("userProfile");
    localStorage.removeItem("selectedCountry");
    localStorage.removeItem("savedAttractions");
    setUserProfile(null);
    setSelectedCountry(null);
    setSavedAttractions([]);
    setTotalBudget(0);
    setView("landing");
  };

  const handleClearCompilation = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vider la liste ?")) {
      setSavedAttractions([]);
      localStorage.removeItem("savedAttractions");
    }
  };

  return (
    <div className="tourism-container">
      {view !== "landing" && (
        <header className="tourism-header">
          <div className="header-left">
            <div className="logo">TravelGuide</div>
            {selectedCountry && (
              <span className="country-badge">{selectedCountry.name}</span>
            )}
          </div>
          <nav className="nav">
            <button
              className={`nav-btn ${view === "home" ? "active" : ""}`}
              onClick={() => setView("home")}
              title="Retour à l'accueil"
            >
              Accueil
            </button>
            <button
              className={`nav-btn ${view === "search" ? "active" : ""}`}
              onClick={() => setView("search")}
              title="Rechercher des attractions"
            >
              Rechercher
            </button>
            <button
              className={`nav-btn saved-btn ${
                view === "compilation" ? "active" : ""
              }`}
              onClick={() => setView("compilation")}
              title="Voir mes attractions sauvegardées"
            >
              Compilation ({savedAttractions.length})
              {totalBudget > 0 && (
                <span className="budget-badge">${totalBudget}</span>
              )}
            </button>
            <button
              className="nav-btn profile-btn"
              onClick={resetProfile}
              title="Déconnexion"
            >
              👤 {userProfile}
            </button>
          </nav>
        </header>
      )}

      <main className="tourism-main">
        {loading && view !== "landing" && (
          <div className="global-loading">Chargement...</div>
        )}

        {view === "landing" && (
          <LandingPage
            countries={countries}
            onProfileSetup={handleProfileSetup}
          />
        )}

        {view === "home" && (
          <HomePage
            API_URL={API_URL}
            selectedCountry={selectedCountry}
            userProfile={userProfile}
            onSelectAttraction={handleSelectAttraction}
            savedAttractions={savedAttractions}
            onSaveAttraction={handleSaveAttraction}
          />
        )}

        {view === "search" && (
          <SearchPage
            API_URL={API_URL}
            selectedCountry={selectedCountry}
            userProfile={userProfile}
            onSelectAttraction={handleSelectAttraction}
            savedAttractions={savedAttractions}
            onSaveAttraction={handleSaveAttraction}
          />
        )}

        {view === "attraction" && selectedAttraction && (
          <AttractionPage
            API_URL={API_URL}
            attraction={selectedAttraction}
            onBack={() => setView("search")}
            savedAttractions={savedAttractions}
            onSaveAttraction={handleSaveAttraction}
            onSelectAttraction={handleSelectAttraction}
          />
        )}

        {view === "compilation" && (
          <CompilationPage
            API_URL={API_URL}
            attractions={savedAttractions}
            totalBudget={totalBudget}
            onRemoveAttraction={handleRemoveAttraction}
            onClearCompilation={handleClearCompilation}
            onSelectAttraction={handleSelectAttraction}
          />
        )}
      </main>

      {view !== "landing" && (
        <footer className="tourism-footer">
          <p>© 2025 TravelGuide - Découvrez le monde autrement</p>
        </footer>
      )}
    </div>
  );
}

export default App;