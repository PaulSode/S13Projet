import { useState } from "react";
import "./LandingPage.css";

const LandingPage = ({ countries, onProfileSetup }) => {
  const [step, setStep] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const profiles = [
    {
      type: "local",
      title: "Local",
      icon: "🏘️",
      description: "Restaurants et activités",
    },
    {
      type: "tourist",
      title: "Touriste",
      icon: "✈️",
      description: "Tous les résultats",
    },
    {
      type: "professional",
      title: "Professionnel",
      icon: "💼",
      description: "Hôtels et restaurants",
    },
  ];

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
    setStep(2);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
  };

  const handleSubmit = () => {
    if (selectedProfile && selectedCountry) {
      onProfileSetup(selectedProfile, selectedCountry);
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <h1 className="landing-title">
          Bienvenue sur TravelGuide
        </h1>
        <p className="landing-subtitle">
          Votre compagnon de voyage blablabla
        </p>
      </div>

      <div className="landing-content">
        {step === 1 && (
          <div className="step-container">
            <h2 className="step-title">Choisissez votre profil</h2>
            <div className="profiles-grid">
              {profiles.map((profile) => (
                <div
                  key={profile.type}
                  className={`profile-card ${
                    selectedProfile === profile.type ? "selected" : ""
                  }`}
                  onClick={() => handleProfileSelect(profile.type)}
                >
                  <div className="profile-icon">{profile.icon}</div>
                  <h3 className="profile-title">{profile.title}</h3>
                  <p className="profile-desc">{profile.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-container">
            <button className="back-btn" onClick={() => setStep(1)}>
              ← Retour
            </button>
            <h2 className="step-title">Sélectionnez un pays</h2>
            <div className="countries-grid">
              {countries.map((country) => (
                <div
                  key={country.id}
                  className={`country-card ${
                    selectedCountry?.id === country.id ? "selected" : ""
                  }`}
                  onClick={() => handleCountrySelect(country)}
                >
                  <div className="country-flag">🏳️</div>
                  <h3 className="country-name">{country.name}</h3>
                  <p className="country-capital">{country.capital}</p>
                </div>
              ))}
            </div>
            {selectedCountry && (
              <button className="continue-btn" onClick={handleSubmit}>
                Continuer →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;