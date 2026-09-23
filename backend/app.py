from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ==========================================
# MONGODB CONNECTION
# ==========================================

MONGO_URI = "mongodb://127.0.0.1:27017"

client = MongoClient(MONGO_URI)

db = client["AI_Waste_Detector"]

detections_collection = db["detections"]


# ==========================================
# HOME ROUTE
# ==========================================

@app.route("/")
def home():
    return "AI Waste Detector Backend is Running!"


# ==========================================
# TEST DATABASE CONNECTION
# ==========================================

@app.route("/test-db")
def test_db():

    try:

        client.admin.command("ping")

        return jsonify({
            "success": True,
            "message": "MongoDB connected successfully!",
            "database": "AI_Waste_Detector",
            "collection": "detections"
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "message": "MongoDB connection failed",
            "error": str(error)
        }), 500


# ==========================================
# SAVE DETECTION
# ==========================================

@app.route("/save-detection", methods=["POST"])
def save_detection():

    try:

        data = request.get_json()

        # Get data from request
        waste = data.get("waste")
        category = data.get("category")
        confidence = data.get("confidence")
        suggestion = data.get("suggestion")

        # Check required fields
        if not waste or not category:

            return jsonify({
                "success": False,
                "message": "Waste and category are required."
            }), 400

        # Create detection document
        detection = {
            "waste": waste,
            "category": category,
            "confidence": confidence,
            "suggestion": suggestion,
            "created_at": datetime.now()
        }

        # Save into MongoDB
        result = detections_collection.insert_one(detection)

        return jsonify({
            "success": True,
            "message": "Detection saved successfully!",
            "id": str(result.inserted_id)
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "message": "Failed to save detection.",
            "error": str(error)
        }), 500


# ==========================================
# GET DETECTION HISTORY
# ==========================================

@app.route("/history", methods=["GET"])
def get_history():

    try:

        detections = detections_collection.find().sort(
            "created_at",
            -1
        )

        history = []

        for detection in detections:

            history.append({
                "id": str(detection["_id"]),
                "waste": detection.get("waste"),
                "category": detection.get("category"),
                "confidence": detection.get("confidence"),
                "suggestion": detection.get("suggestion"),
                "created_at": detection.get(
                    "created_at"
                ).isoformat()
            })

        return jsonify({
            "success": True,
            "count": len(history),
            "data": history
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "message": "Failed to retrieve history.",
            "error": str(error)
        }), 500


# ==========================================
# GET DASHBOARD STATISTICS
# ==========================================

@app.route("/statistics", methods=["GET"])
def get_statistics():

    try:

        # Count all detections
        total_detections = detections_collection.count_documents({})

        # Waste categories
        categories = [
            "Plastic",
            "Paper",
            "Glass",
            "Metal",
            "Organic",
            "E-Waste",
            "Other"
        ]

        # Store count for every category
        category_counts = {}

        for category in categories:

            count = detections_collection.count_documents({
                "category": category
            })

            category_counts[category] = count

        return jsonify({
            "success": True,
            "total_detections": total_detections,
            "categories": category_counts
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "message": "Failed to retrieve statistics.",
            "error": str(error)
        }), 500


# ==========================================
# RUN SERVER
# ==========================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )