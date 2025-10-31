import { useState, useEffect } from "react";
import "./CompilationPage.css";

const CompilationPage = ({
  API_URL,
  attractions,
  totalBudget,
  onRemoveAttraction,
  onClearCompilation,
  onSelectAttraction,
}) => {
  const [sortBy, setSortBy] = useState("budget_asc");
  const [sortedAttractions, setSortedAttractions] = useState(attractions);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => console.log("Geolocation non disponible:", error)
      );
    }
  }, []);

  useEffect(() => {
    sortAttractions();
  }, [attractions, sortBy]);

  const sortAttractions = async () => {
    let sorted = [...attractions];

    if (sortBy === "budget_asc") {
      const priceMap = {
        free: 0,
        budget: 1,
        moderate: 2,
        expensive: 3,
        luxury: 4,
      };
      sorted.sort((a, b) => {
        const priceA = priceMap[a.price_level] || 0;
        const priceB = priceMap[b.price_level] || 0;
        return priceA - priceB;
      });
    } else if (sortBy === "budget_desc") {
      const priceMap = {
        free: 0,
        budget: 1,
        moderate: 2,
        expensive: 3,
        luxury: 4,
      };
      sorted.sort((a, b) => {
        const priceA = priceMap[a.price_level] || 0;
        const priceB = priceMap[b.price_level] || 0;
        return priceB - priceA;
      });
    } else if (sortBy === "distance" && userLocation) {
      setLoading(true);
      try {
        sorted = await sortByDistance(sorted, userLocation);
      } catch (error) {
        console.error("Erreur tri par distance:", error);
      } finally {
        setLoading(false);
      }
    }

    setSortedAttractions(sorted);
  };

  const sortByDistance = async (attrList, location) => {
    const remaining = [...attrList];
    const sorted = [];
    let current = location;

    while (remaining.length > 0) {
      let nearest = remaining[0];
      let minDistance = calculateDistance(
        current.latitude,
        current.longitude,
        nearest.latitude,
        nearest.longitude
      );

      for (let i = 1; i < remaining.length; i++) {
        const dist = calculateDistance(
          current.latitude,
          current.longitude,
          remaining[i].latitude,
          remaining[i].longitude
        );
        if (dist < minDistance) {
          nearest = remaining[i];
          minDistance = dist;
        }
      }

      sorted.push(nearest);
      remaining.splice(remaining.indexOf(nearest), 1);
      current = { latitude: nearest.latitude, longitude: nearest.longitude };
    }

    return sorted;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getPriceLabel = (priceLevel) => {
    const map = {
      free: "Gratuit",
      budget: "$",
      moderate: "$$",
      expensive: "$$$",
      luxury: "$$$$",
    };
    return map[priceLevel] || "N/A";
  };

  const exportItinerary = () => {
    const itinerary = sortedAttractions
      .map((attr, idx) => `${idx + 1}. ${attr.name} - ${attr.city}`)
      .join("\n");

    const summary = `
=== Mon Itinéraire TravelGuide ===
Date: ${new Date().toLocaleDateString("fr-FR")}
Nombre d'attractions: ${sortedAttractions.length}
Budget total: $${totalBudget}

ITINÉRAIRE:
${itinerary}

Découvrez le monde autrement avec TravelGuide
    `;

    const blob = new Blob([summary], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `itinerary_${new Date().getTime()}.txt`;
    a.click();
  };

  return (
    <div className="compilation-page">
      <div className="compilation-header">
        <h1>Ma Compilation</h1>
        <p className="subtitle">
          {sortedAttractions.length} attraction
          {sortedAttractions.length > 1 ? "s" : ""} • Budget: ${totalBudget}
        </p>
      </div>

      {sortedAttractions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>Votre compilation est vide</h2>
          <p>Explorez les attractions et ajoutez-les à votre liste !</p>
          <a href="/" className="btn-explore">
            Commencer à explorer
          </a>
        </div>
      ) : (
        <>
          <div className="compilation-controls">
            <div className="sort-section">
              <label htmlFor="sort">Trier par:</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="budget_asc">Budget (croissant)</option>
                <option value="budget_desc">Budget (décroissant)</option>
                {userLocation && (
                  <option value="distance">
                    Distance (itinéraire optimisé)
                  </option>
                )}
              </select>
            </div>

            <div className="action-buttons">
              <button className="btn-export" onClick={exportItinerary}>
                📥 Exporter
              </button>
              <button
                className="btn-clear"
                onClick={onClearCompilation}
              >
                🗑️ Vider la liste
              </button>
            </div>
          </div>

          {loading && <div className="loading-sort">⏳ Calcul de l'itinéraire...</div>}

          <div className="compilation-list">
            {sortedAttractions.map((attraction, index) => (
              <div key={attraction.id} className="compilation-item">
                {sortBy === "distance" && (
                  <div className="item-number">{index + 1}</div>
                )}

                <div className="item-image">
                  <img
                    src={
                      attraction.main_image ||
                      "https://via.placeholder.com/100x100"
                    }
                    alt={attraction.name}
                  />
                </div>

                <div className="item-content">
                  <h3 className="item-title">{attraction.name}</h3>
                  <p className="item-location">
                    📍 {attraction.city || "Non spécifié"}
                  </p>
                  {attraction.category && (
                    <p className="item-category">📂 {attraction.category}</p>
                  )}
                  <div className="item-meta">
                    {attraction.tripadvisor_rating && (
                      <span className="meta-rating">
                        ⭐ {attraction.tripadvisor_rating}
                      </span>
                    )}
                    {attraction.num_reviews && (
                      <span className="meta-reviews">
                        💬 {attraction.num_reviews}
                      </span>
                    )}
                  </div>
                </div>

                <div className="item-stats">
                  {attraction.price_level && (
                    <span className="stat-price">
                      {getPriceLabel(attraction.price_level)}
                    </span>
                  )}
                  {attraction.num_likes && (
                    <span className="stat-likes">❤️ {attraction.num_likes}</span>
                  )}
                </div>

                <div className="item-actions">
                  <button
                    className="btn-view"
                    onClick={() => onSelectAttraction(attraction.id)}
                    title="Voir les détails"
                  >
                    👁️
                  </button>
                  <button
                    className="btn-remove"
                    onClick={() => onRemoveAttraction(attraction.id)}
                    title="Retirer de la liste"
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="compilation-summary">
            <div className="summary-card">
              <h4>Résumé</h4>
              <div className="summary-stat">
                <span>Attractions:</span>
                <strong>{sortedAttractions.length}</strong>
              </div>
              <div className="summary-stat">
                <span>Budget total:</span>
                <strong>${totalBudget}</strong>
              </div>
              <div className="summary-stat">
                <span>Budget moyen:</span>
                <strong>
                  ${(totalBudget / sortedAttractions.length).toFixed(2)}
                </strong>
              </div>
              {sortBy === "distance" && userLocation && (
                <div className="summary-stat">
                  <span>Itinéraire:</span>
                  <strong>Optimisé ✓</strong>
                </div>
              )}
            </div>

            {sortBy === "distance" && userLocation && (
              <div className="summary-card">
                <h4>Itinéraire</h4>
                <p className="itinerary-info">
                  Cet itinéraire a été optimisé en utilisant l'algorithme du
                  plus proche voisin pour minimiser la distance totale.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CompilationPage;