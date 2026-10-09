import time
from typing import Dict, List, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Comprehensive taxonomies and domain lexicons for 10 target categories
TOPIC_TAXONOMIES = {
    "Finance and Markets": [
        "stock market", "shares", "investing", "nasdaq", "dow jones", "s&p 500", "bonds", "treasuries",
        "central bank", "interest rate", "inflation", "federal reserve", "yield", "currency", "forex",
        "quarterly earnings", "dividend", "hedge fund", "cryptocurrency", "bitcoin", "etf", "securities",
        "market rally", "bull market", "bear market", "ipo", "valuation", "fiscal policy"
    ],
    "Business and Economy": [
        "company", "enterprise", "merger", "acquisition", "startup", "venture capital", "revenue", "profit",
        "ceo", "executive", "board of directors", "supply chain", "logistics", "retail", "manufacturing",
        "industry", "commerce", "sales", "layoffs", "hiring", "corporate", "expansion", "restructuring"
    ],
    "Technology and AI": [
        "artificial intelligence", "machine learning", "neural network", "deep learning", "large language model",
        "algorithm", "software", "hardware", "semiconductor", "microchip", "cloud computing", "cybersecurity",
        "robotics", "automation", "data center", "smartphones", "quantum computing", "developer", "saas", "app"
    ],
    "Politics and Government": [
        "government", "election", "parliament", "congress", "senate", "prime minister", "president",
        "legislation", "bill", "court", "supreme court", "lawmakers", "policy", "political party",
        "voting", "campaign", "democracy", "minister", "cabinet", "ruling party", "opposition"
    ],
    "Healthcare": [
        "medicine", "hospital", "patient", "clinical trial", "pharmaceutical", "drug", "fda", "disease",
        "treatment", "vaccine", "health care", "doctor", "physician", "public health", "cancer",
        "therapy", "diagnosis", "surgery", "epidemic", "biotechnology", "medical device"
    ],
    "Science": [
        "research", "scientists", "physics", "astronomy", "space exploration", "nasa", "esa", "biology",
        "genetics", "chemistry", "discovery", "laboratory", "experiment", "telescope", "quantum",
        "academic study", "journal", "peer review", "evolution", "particle physics", "cosmos"
    ],
    "Sports": [
        "cricket", "football", "soccer", "basketball", "tennis", "olympics", "tournament", "championship",
        "match", "league", "coach", "athlete", "player", "trophy", "stadium", "world cup", "goal",
        "wicket", "score", "victory", "medal", "team", "ipl", "premier league"
    ],
    "Environment": [
        "climate change", "global warming", "carbon emissions", "renewable energy", "solar power",
        "wind power", "pollution", "sustainability", "conservation", "wildlife", "deforestation",
        "greenhouse gas", "biodiversity", "extreme weather", "clean energy", "ecology", "ocean"
    ],
    "Education": [
        "university", "college", "school", "students", "teachers", "professors", "curriculum", "campus",
        "degrees", "higher education", "academic", "scholarship", "tuition", "classroom", "literacy",
        "examinations", "educational institution"
    ],
    "International Affairs": [
        "foreign policy", "diplomacy", "united nations", "treaty", "ambassador", "sanctions", "geopolitics",
        "bilateral talks", "summit", "international relations", "global summit", "nato", "conflict",
        "security council", "cross-border", "alliance", "peace talks", "trade agreement"
    ]
}

class TopicClassifier:
    """
    Classifies news text into 10 structured academic/industry categories using
    TF-IDF Vector Space taxonomy profiles and Cosine Similarity scoring.
    """

    def __init__(self):
        self.categories = list(TOPIC_TAXONOMIES.keys())
        # Build category profile documents
        self.category_docs = [" ".join(phrases) for phrases in TOPIC_TAXONOMIES.values()]
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
        self.category_matrix = self.vectorizer.fit_transform(self.category_docs)

    def classify(self, text: str) -> Dict[str, Any]:
        start_time = time.perf_counter()
        if not text or len(text.strip()) < 10:
            return {
                "primary_topic": "General",
                "confidence": 0.5,
                "all_scores": {cat: 0.1 for cat in self.categories},
                "topic_phrases": [],
                "method": "Vector Space Taxonomy Classifier",
                "execution_time_ms": 0.0
            }

        text_vec = self.vectorizer.transform([text])
        raw_sims = cosine_similarity(text_vec, self.category_matrix)[0]

        # Softmax-like calibration
        exp_sims = np.exp(raw_sims * 3.5)
        probs = exp_sims / np.sum(exp_sims)

        score_dict = {}
        for cat, prob in zip(self.categories, probs):
            score_dict[cat] = round(float(prob), 3)

        # Best category
        best_idx = int(np.argmax(raw_sims))
        primary_topic = self.categories[best_idx]
        confidence = round(float(probs[best_idx]), 3)

        # Find matching topic phrases in the text
        matched_phrases = []
        text_lower = text.lower()
        for phrase in TOPIC_TAXONOMIES[primary_topic]:
            if phrase in text_lower:
                matched_phrases.append(phrase)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "primary_topic": primary_topic,
            "confidence": confidence,
            "all_scores": score_dict,
            "topic_phrases": matched_phrases[:8],
            "method": "Domain Vector Cosine Taxonomy Classifier",
            "execution_time_ms": round(elapsed_ms, 2)
        }

# Singleton instance
topic_classifier = TopicClassifier()
