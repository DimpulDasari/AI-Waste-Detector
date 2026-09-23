import { useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";
import "./App.css";
import History from "./History";
import Dashboard from "./Dashboard";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);

  const [cameraStarted, setCameraStarted] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [savingResult, setSavingResult] = useState(false);
  const [activePage, setActivePage] = useState("detect");

  // ==========================================
  // LOAD TEACHABLE MACHINE MODEL
  // ==========================================

  useEffect(() => {
    const loadModel = async () => {
      try {
        const modelURL = "/model/model.json";
        const metadataURL = "/model/metadata.json";

        const model = await tmImage.load(modelURL, metadataURL);

        modelRef.current = model;

        setModelLoading(false);

        console.log("✅ Teachable Machine model loaded successfully!");
      } catch (error) {
        console.error("❌ Model loading error:", error);

        setModelLoading(false);

        alert("Could not load the AI model. Please check the model folder.");
      }
    };

    loadModel();
  }, []);

  // ==========================================
  // START CAMERA
  // ==========================================

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      videoRef.current.srcObject = stream;

      setCameraStarted(true);

      console.log("✅ Camera started");
    } catch (error) {
      console.error("❌ Camera access error:", error);

      alert("Unable to access camera. Please allow camera permission.");
    }
  };

  // ==========================================
  // CAPTURE IMAGE
  // ==========================================

  const captureFrame = () => {
    if (!cameraStarted || !videoRef.current) {
      alert("Please start the camera first.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg");

    setCapturedImage(imageData);

    // Clear previous detection
    setDetectionResult(null);

    console.log("📸 Image captured");
  };

  // ==========================================
  // ANALYZE WASTE
  // TEACHABLE MACHINE + MONGODB
  // ==========================================

  const analyzeWaste = async () => {
    if (!capturedImage) {
      alert("Please capture a waste image first!");
      return;
    }

    if (!modelRef.current) {
      alert("AI model is still loading. Please wait a moment and try again.");
      return;
    }

    try {
      setSavingResult(true);

      // --------------------------------------
      // CREATE IMAGE FROM CAPTURED IMAGE
      // --------------------------------------

      const image = new Image();

      image.src = capturedImage;

      image.onload = async () => {
        try {
          // --------------------------------------
          // GET PREDICTIONS
          // --------------------------------------

          const predictions = await modelRef.current.predict(image);

          console.log("🤖 Teachable Machine Predictions:", predictions);

          // --------------------------------------
          // FIND HIGHEST PREDICTION
          // --------------------------------------

          let highestPrediction = predictions[0];

          for (let i = 1; i < predictions.length; i++) {
            if (predictions[i].probability > highestPrediction.probability) {
              highestPrediction = predictions[i];
            }
          }

          // --------------------------------------
          // CATEGORY
          // --------------------------------------

          const category = highestPrediction.className;

          // --------------------------------------
          // CONFIDENCE
          // --------------------------------------

          const confidence = parseFloat(
            (highestPrediction.probability * 100).toFixed(2),
          );

          // --------------------------------------
          // DISPOSAL SUGGESTIONS
          // --------------------------------------

          const suggestions = {
            Plastic: "Place plastic waste in the recyclable/plastic waste bin.",

            Paper: "Place clean paper waste in the paper recycling bin.",

            Glass: "Place glass waste in the glass recycling container.",

            Metal: "Place metal waste in the metal recycling bin.",

            Organic: "Place organic waste in the compost or wet waste bin.",

            "E-Waste":
              "Take electronic waste to an authorized e-waste collection center.",

            Other:
              "Dispose of this item according to your local waste management rules.",
          };

          const suggestion =
            suggestions[category] ||
            "Dispose of this waste according to local waste management rules.";

          const waste = `${category} Waste`;

          // --------------------------------------
          // SHOW RESULT ON WEBSITE
          // --------------------------------------

          setDetectionResult({
            waste: waste,
            category: category,
            confidence: confidence,
            suggestion: suggestion,
          });

          console.log("✅ Detection result:", {
            waste,
            category,
            confidence,
            suggestion,
          });

          // ======================================
          // SAVE RESULT TO MONGODB
          // ======================================

          try {
            console.log("💾 Saving detection to MongoDB...");

            const response = await fetch(
              "http://127.0.0.1:5000/save-detection",
              {
                method: "POST",

                headers: {
                  "Content-Type": "application/json",
                },

                body: JSON.stringify({
                  waste: waste,
                  category: category,
                  confidence: confidence,
                  suggestion: suggestion,
                }),
              },
            );

            const data = await response.json();

            console.log("MongoDB Save Result:", data);

            if (data.success) {
              console.log("✅ Detection saved to MongoDB!");
            } else {
              console.error("❌ Detection was not saved:", data.message);

              alert(
                "Detection completed, but the result could not be saved to the database.",
              );
            }
          } catch (databaseError) {
            console.error("❌ MongoDB save error:", databaseError);

            alert(
              "Detection worked, but the result could not be saved to MongoDB. Make sure the Flask backend is running.",
            );
          } finally {
            setSavingResult(false);
          }
        } catch (predictionError) {
          console.error(
            "❌ Teachable Machine prediction error:",
            predictionError,
          );

          setSavingResult(false);

          alert("Could not analyze the image. Please try again.");
        }
      };

      image.onerror = () => {
        setSavingResult(false);

        alert("Could not load the captured image.");
      };
    } catch (error) {
      console.error("❌ Analysis error:", error);

      setSavingResult(false);

      alert("Could not analyze the image. Please try again.");
    }
  };

  // ==========================================
  // STOP CAMERA
  // ==========================================

  const stopCamera = () => {
    const video = videoRef.current;

    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      video.srcObject = null;
    }

    setCameraStarted(false);

    console.log("🛑 Camera stopped");
  };

  // ==========================================
  // OPEN HISTORY PAGE
  // ==========================================

  const openHistory = () => {
    // Stop camera before leaving detection page
    if (cameraStarted) {
      stopCamera();
    }

    setActivePage("history");
  };

  // ==========================================
  // OPEN DETECTION PAGE
  // ==========================================

  const openDetection = () => {
    setActivePage("detect");
  };

  // ==========================================
  // FRONTEND
  // ==========================================

  return (
    <div className="app">
      {/* ======================================
          NAVIGATION BAR
      ====================================== */}

      <nav className="navbar">
        <div className="nav-logo">♻️ AI Waste Detector</div>

        <div className="nav-links">
          <button
            className={
              activePage === "detect" ? "nav-button active" : "nav-button"
            }
            onClick={openDetection}
          >
            Detect Waste
          </button>

          <button
            className={
              activePage === "history" ? "nav-button active" : "nav-button"
            }
            onClick={openHistory}
          >
            History
          </button>

          <button
            className={
              activePage === "dashboard" ? "nav-button active" : "nav-button"
            }
            onClick={() => setActivePage("dashboard")}
          >
            Dashboard
          </button>
        </div>
      </nav>

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="header">
        <h1>♻️ AI Smart Waste Detector</h1>

        <p>Real-Time Waste Detection & Segregation System</p>
      </header>

      {/* ======================================
          DETECTION PAGE
      ====================================== */}

      {activePage === "detect" && (
        <main className="main-container">
          {/* ====================================
              CAMERA SECTION
          ==================================== */}

          <section className="camera-section">
            <div className="camera-box">
              {/* CAMERA PLACEHOLDER */}

              {!cameraStarted && (
                <>
                  <div className="camera-icon">📷</div>

                  <h2>Camera Preview</h2>

                  <p>Click below to start your camera</p>
                </>
              )}

              {/* CAMERA VIDEO */}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="camera-video"
              />

              {/* HIDDEN CANVAS */}

              <canvas
                ref={canvasRef}
                style={{
                  display: "none",
                }}
              />

              {/* MODEL STATUS */}

              {modelLoading && <p>🤖 Loading AI model...</p>}

              {!modelLoading && <p>✅ AI model ready</p>}

              {/* START CAMERA */}

              {!cameraStarted && (
                <button className="camera-button" onClick={startCamera}>
                  Start Camera
                </button>
              )}

              {/* CAPTURE + ANALYZE + STOP */}

              {cameraStarted && (
                <div className="button-container">
                  <button className="capture-button" onClick={captureFrame}>
                    📸 Capture Waste
                  </button>

                  <button
                    className="analyze-button"
                    onClick={analyzeWaste}
                    disabled={modelLoading || savingResult}
                  >
                    {savingResult ? "⏳ Analyzing..." : "🤖 Analyze Waste"}
                  </button>

                  <button className="stop-button" onClick={stopCamera}>
                    🛑 Stop Camera
                  </button>
                </div>
              )}

              {/* CAPTURED IMAGE */}

              {capturedImage && (
                <div className="captured-preview">
                  <h3>Captured Image</h3>

                  <img src={capturedImage} alt="Captured waste" />
                </div>
              )}
            </div>
          </section>

          {/* ====================================
              DETECTION RESULT
          ==================================== */}

          <section className="result-section">
            <h2>Detection Result</h2>

            <div className="result-card">
              {/* DETECTED WASTE */}

              <div className="result-item">
                <span>Detected Waste</span>

                <strong>{detectionResult ? detectionResult.waste : "—"}</strong>
              </div>

              {/* CATEGORY */}

              <div className="result-item">
                <span>Category</span>

                <strong>
                  {detectionResult ? detectionResult.category : "—"}
                </strong>
              </div>

              {/* CONFIDENCE */}

              <div className="result-item">
                <span>Confidence</span>

                <strong>
                  {detectionResult ? `${detectionResult.confidence}%` : "—"}
                </strong>
              </div>

              {/* DISPOSAL SUGGESTION */}

              <div className="disposal-box">
                <h3>♻️ Disposal Suggestion</h3>

                <p>
                  {detectionResult
                    ? detectionResult.suggestion
                    : "Detection result will appear here."}
                </p>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ======================================
          HISTORY PAGE
      ====================================== */}

      {activePage === "history" && <History />}
      {activePage === "dashboard" && <Dashboard />}

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer>
        <p>AI-Based Real-Time Smart Waste Detection System</p>
      </footer>
    </div>
  );
}

export default App;
