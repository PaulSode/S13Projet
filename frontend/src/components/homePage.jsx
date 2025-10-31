import { useState, useEffect } from "react";
import "./HomePage.css";

const HomePage = ({
  API_URL,
  selectedCountry,
  userProfile,
  onSelectAttraction,
  savedAttractions,
  onSaveAttraction,
}) => {
  const [popularAttractions, setPopularAttractions] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedCountry) {
      setLoading(true);
      fetch(
        `${API_URL}/attractions/popular/?country=${selectedCountry.id}&profile_type=${userProfile}`
      )
        .then((res) => res.json())
        .then((data) => {
          setPopularAttractions(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Erreur:", err);
          setLoading(false);
        });
    }
  }, [selectedCountry, userProfile]);

  const nextSlide = () => {
    setCarouselIndex((prev) =>
      prev === popularAttractions.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCarouselIndex((prev) =>
      prev === 0 ? popularAttractions.length - 1 : prev - 1
    );
  };

  const isSaved = (attraction) => {
    return savedAttractions.some((a) => a.id === attraction.id);
  };

  if (loading) {
    return <div className="loading">Chargement des attractions...</div>;
  }

  return (
    <div className="home-page">
      <section className="hero-section">
        <h1 className="page-title">
          Découvrez {selectedCountry.name}
        </h1>
        <p className="page-subtitle">
          Les attractions les plus populaires, triées par nombre de likes
        </p>
      </section>

      {popularAttractions.length > 0 && (
        <section className="carousel-section">
          <h2 className="section-title">Top Attractions</h2>
          <div className="carousel">
            <button className="carousel-btn prev" onClick={prevSlide}>
              ←
            </button>

            <div className="carousel-main">
              <div
                className="carousel-image"
                style={{
                  backgroundImage: `url(${
                    popularAttractions[carouselIndex].main_image ||
                    "https://via.placeholder.com/800x400"
                  })`,
                }}
              >
                <div className="carousel-overlay">
                  <div className="carousel-info">
                    <h3 className="carousel-title">
                      {popularAttractions[carouselIndex].name}
                    </h3>
                    <div className="carousel-meta">
                      <span className="rating">
                        ⭐{" "}
                        {popularAttractions[carouselIndex].tripadvisor_rating}
                      </span>
                      <span className="reviews">
                        {popularAttractions[carouselIndex].num_reviews} avis
                      </span>
                      <span className="likes">
                        ❤️ {popularAttractions[carouselIndex].likes_count}{" "}
                        likes
                      </span>
                    </div>
                    <p className="carousel-location">
                      {popularAttractions[carouselIndex].city}
                    </p>
                    <div className="carousel-actions">
                      <button
                        className="btn-primary"
                        onClick={() =>
                          onSelectAttraction(
                            popularAttractions[carouselIndex].id
                          )
                        }
                      >
                        Voir détails
                      </button>
                      <button
                        className={`btn-save ${
                          isSaved(popularAttractions[carouselIndex])
                            ? "saved"
                            : ""
                        }`}
                        onClick={() =>
                          onSaveAttraction(popularAttractions[carouselIndex])
                        }
                      >
                        {isSaved(popularAttractions[carouselIndex])
                          ? "✓ Sauvegardé"
                          : "💾 Sauvegarder"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="carousel-indicators">
                {popularAttractions.map((_, idx) => (
                  <button
                    key={idx}
                    className={`indicator ${
                      idx === carouselIndex ? "active" : ""
                    }`}
                    onClick={() => setCarouselIndex(idx)}
                  />
                ))}
              </div>
            </div>

            <button className="carousel-btn next" onClick={nextSlide}>
              →
            </button>
          </div>
        </section>
      )}

      <section className="saved-section">
        <h2 className="section-title">Favoris</h2>
        {savedAttractions.length === 0 ? (
          <div className="empty-state">
            <p>Aucune attraction sauvegardée pour le moment</p>
            <p className="empty-hint">
              Explorez et sauvegardez vos attractions préférées !
            </p>
          </div>
        ) : (
          <div className="attractions-grid">
            {savedAttractions.map((attraction) => (
              <div key={attraction.id} className="attraction-card">
                <div
                  className="card-image"
                  style={{
                    backgroundImage: `url(${
                      attraction.main_image ||
                      "https://via.placeholder.com/300x200"
                    })`,
                  }}
                >
                  <button
                    className="remove-btn"
                    onClick={() => onSaveAttraction(attraction)}
                  >
                    ×
                  </button>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{attraction.name}</h3>
                  <p className="card-location">📍 {attraction.city}</p>
                  <div className="card-meta">
                    <span className="rating">
                      ⭐ {attraction.tripadvisor_rating}
                    </span>
                    <span className="category">{attraction.category}</span>
                  </div>
                  <button
                    className="btn-view"
                    onClick={() => onSelectAttraction(attraction.id)}
                  >
                    Voir détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;