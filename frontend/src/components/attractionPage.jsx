import { useState } from "react";
import "./AttractionPage.css";

const AttractionPage = ({
  attraction,
  onBack,
  savedAttractions,
  onSaveAttraction,
  onSelectAttraction,
}) => {
  const [selectedImage, setSelectedImage] = useState(0);

  const isSaved = savedAttractions.some((a) => a.id === attraction.id);

  const formatOpeningHours = (hours) => {
    if (!hours || Object.keys(hours).length === 0) return "Non disponible";
    return Object.entries(hours)
      .map(([day, time]) => `${day}: ${time}`)
      .join(", ");
  };

  const getPriceLevel = (level) => {
    if (!level) return "Non spécifié";
    return "$".repeat(level);
  };

  return (
    <div className="attraction-page">
      <button className="back-btn" onClick={onBack}>
        ← Retour à la recherche
      </button>

      <div className="attraction-layout">
        {/* Section images */}
        <div className="attraction-gallery">
          <div
            className="main-image"
            style={{
              backgroundImage: `url(${
                attraction.images[selectedImage] ||
                "https://via.placeholder.com/800x600"
              })`,
            }}
          >
            {attraction.awards && attraction.awards.length > 0 && (
              <div className="awards-badge">
                {attraction.awards.length} récompense
                {attraction.awards.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
          {attraction.images && attraction.images.length > 1 && (
            <div className="image-thumbnails">
              {attraction.images.map((img, idx) => (
                <div
                  key={idx}
                  className={`thumbnail ${
                    idx === selectedImage ? "active" : ""
                  }`}
                  style={{ backgroundImage: `url(${img})` }}
                  onClick={() => setSelectedImage(idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Section informations */}
        <div className="attraction-info">
          <div className="info-header">
            <div>
              <h1 className="attraction-name">{attraction.name}</h1>
              <p className="attraction-category">
                {attraction.category} • {attraction.city}, {attraction.country.name}
              </p>
            </div>
            <button
              className={`save-btn-large ${isSaved ? "saved" : ""}`}
              onClick={() => onSaveAttraction(attraction)}
            >
              {isSaved ? "✓ Sauvegardé" : "💾 Sauvegarder"}
            </button>
          </div>

          {/* Ratings */}
          <div className="ratings-section">
            <div className="rating-box">
              <span className="rating-score">
                ⭐ {attraction.tripadvisor_rating}
              </span>
              <span className="rating-text">Note TripAdvisor</span>
            </div>
            <div className="rating-box">
              <span className="rating-score">{attraction.num_reviews}</span>
              <span className="rating-text">Avis</span>
            </div>
            <div className="rating-box">
              <span className="rating-score">❤️ {attraction.likes_count}</span>
              <span className="rating-text">Likes</span>
            </div>
            {attraction.ranking && (
              <div className="rating-box">
                <span className="rating-score">#{attraction.ranking}</span>
                <span className="rating-text">Classement</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="info-section">
            <h2 className="section-title">Description</h2>
            <p className="description">{attraction.description}</p>
          </div>

          {/* Informations pratiques */}
          <div className="info-section">
            <h2 className="section-title">Informations pratiques</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Adresse:</span>
                <span className="info-value">{attraction.address}</span>
              </div>
              {attraction.phone && (
                <div className="info-item">
                  <span className="info-label">Téléphone:</span>
                  <span className="info-value">{attraction.phone}</span>
                </div>
              )}
              {attraction.website && (
                <div className="info-item">
                  <span className="info-label">Site web:</span>
                  <a
                    href={attraction.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="info-link"
                  >
                    Visiter le site
                  </a>
                </div>
              )}
              {attraction.email && (
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{attraction.email}</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Niveau de prix:</span>
                <span className="info-value">
                  {getPriceLevel(attraction.price_level)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Coordonnées GPS:</span>
                <span className="info-value">
                  {attraction.latitude}, {attraction.longitude}
                </span>
              </div>
            </div>
          </div>

          {/* Horaires d'ouverture */}
          {attraction.opening_hours &&
            Object.keys(attraction.opening_hours).length > 0 && (
              <div className="info-section">
                <h2 className="section-title">Horaires d'ouverture</h2>
                <div className="opening-hours">
                  {Object.entries(attraction.opening_hours).map(
                    ([day, hours]) => (
                      <div key={day} className="hours-row">
                        <span className="day">{day}</span>
                        <span className="hours">{hours}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Informations spécifiques */}
          {attraction.cuisine_type && (
            <div className="info-section">
              <h2 className="section-title">Type de cuisine</h2>
              <p className="special-info">{attraction.cuisine_type}</p>
            </div>
          )}

          {attraction.hotel_style && (
            <div className="info-section">
              <h2 className="section-title">Style de l'hôtel</h2>
              <p className="special-info">{attraction.hotel_style}</p>
            </div>
          )}

          {attraction.attraction_groups &&
            attraction.attraction_groups.length > 0 && (
              <div className="info-section">
                <h2 className="section-title">Groupes d'attractions</h2>
                <div className="groups">
                  {attraction.attraction_groups.map((group, idx) => (
                    <span key={idx} className="group-tag">
                      {group}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Récompenses */}
          {attraction.awards && attraction.awards.length > 0 && (
            <div className="info-section">
              <h2 className="section-title">Récompenses</h2>
              <div className="awards-list">
                {attraction.awards.map((award, idx) => (
                  <div key={idx} className="award-item">
                    <span className="award-icon">🏆</span>
                    <span className="award-name">{award}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggestions similaires */}
      {attraction.similar_attractions &&
        attraction.similar_attractions.length > 0 && (
          <div className="similar-section">
            <h2 className="section-title">
              Attractions similaires dans le quartier
            </h2>
            <div className="similar-grid">
              {attraction.similar_attractions.map((similar) => (
                <div
                  key={similar.id}
                  className="similar-card"
                  onClick={() => onSelectAttraction(similar.id)}
                >
                  <div
                    className="similar-image"
                    style={{
                      backgroundImage: `url(${
                        similar.main_image ||
                        "https://via.placeholder.com/200x150"
                      })`,
                    }}
                  />
                  <div className="similar-info">
                    <h3 className="similar-name">{similar.name}</h3>
                    <p className="similar-rating">
                      ⭐ {similar.tripadvisor_rating}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

export default AttractionPage;