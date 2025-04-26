require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the process if MongoDB connection fails
  });

// Auth Routes
app.use("/api/auth", require("./routes/auth"));

// Schemas
const landmarkSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  category: { type: String, required: true },
  description: String,
  notes: [
    {
      content: String,
      date: { type: Date, default: Date.now },
    },
  ],
  created_at: { type: Date, default: Date.now },
});

const visitSchema = new mongoose.Schema({
  landmark_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Landmark",
    required: true,
  },
  visited_date: { type: Date, required: true },
  visitor_name: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  notes: String,
  created_at: { type: Date, default: Date.now },
});

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  planned_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  notes: String,
  landmarks: [
    {
      landmark_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Landmark",
        required: true,
      },
      notes: String,
    },
  ],
  created_at: { type: Date, default: Date.now },
});

const Landmark = mongoose.model("Landmark", landmarkSchema);
const Visit = mongoose.model("Visit", visitSchema);
const Plan = mongoose.model("Plan", planSchema);

// Routes

// Landmarks
app.get("/api/landmarks", async (req, res) => {
  try {
    const landmarks = await Landmark.find().sort("-created_at");
    res.json(landmarks);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching landmarks", error: err.message });
  }
});

app.post("/api/landmarks", async (req, res) => {
  try {
    const landmark = new Landmark(req.body);
    await landmark.save();
    res.status(201).json(landmark);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error creating landmark", error: err.message });
  }
});

app.get("/api/landmarks/:id", async (req, res) => {
  try {
    const landmark = await Landmark.findById(req.params.id);
    if (!landmark) {
      return res.status(404).json({ message: "Landmark not found" });
    }
    res.json(landmark);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching landmark", error: err.message });
  }
});

app.put("/api/landmarks/:id", async (req, res) => {
  try {
    const landmark = await Landmark.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!landmark) {
      return res.status(404).json({ message: "Landmark not found" });
    }
    res.json(landmark);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating landmark", error: err.message });
  }
});

app.delete("/api/landmarks/:id", async (req, res) => {
  try {
    const landmark = await Landmark.findByIdAndDelete(req.params.id);
    if (!landmark) {
      return res.status(404).json({ message: "Landmark not found" });
    }
    // Delete associated visits
    await Visit.deleteMany({ landmark_id: req.params.id });
    // Remove from plans
    await Plan.updateMany(
      { "landmarks.landmark_id": req.params.id },
      { $pull: { landmarks: { landmark_id: req.params.id } } }
    );
    res.json({ message: "Landmark deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting landmark", error: err.message });
  }
});

// Visits
app.get("/api/visited", async (req, res) => {
  try {
    const visits = await Visit.find()
      .populate("landmark_id")
      .sort("-visited_date");
    res.json(visits);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching visits", error: err.message });
  }
});

app.post("/api/visited", async (req, res) => {
  try {
    const visit = new Visit(req.body);
    await visit.save();
    const populatedVisit = await Visit.findById(visit._id).populate(
      "landmark_id"
    );
    res.status(201).json(populatedVisit);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error recording visit", error: err.message });
  }
});

app.get("/api/visited/:id", async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id).populate("landmark_id");
    if (!visit) {
      return res.status(404).json({ message: "Visit record not found" });
    }
    res.json(visit);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching visit record", error: err.message });
  }
});

app.put("/api/visited/:id", async (req, res) => {
  try {
    const visit = await Visit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("landmark_id");
    if (!visit) {
      return res.status(404).json({ message: "Visit record not found" });
    }
    res.json(visit);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating visit record", error: err.message });
  }
});

app.delete("/api/visited/:id", async (req, res) => {
  try {
    const visit = await Visit.findByIdAndDelete(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: "Visit record not found" });
    }
    res.json({ message: "Visit record deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting visit record", error: err.message });
  }
});

// Plans
app.get("/api/plans", async (req, res) => {
  try {
    const plans = await Plan.find()
      .populate("landmarks.landmark_id")
      .sort("-planned_date");
    res.json(plans);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching plans", error: err.message });
  }
});

app.post("/api/plans", async (req, res) => {
  try {
    const plan = new Plan(req.body);
    await plan.save();
    const populatedPlan = await Plan.findById(plan._id).populate(
      "landmarks.landmark_id"
    );
    res.status(201).json(populatedPlan);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error creating plan", error: err.message });
  }
});

app.get("/api/plans/:id", async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id).populate(
      "landmarks.landmark_id"
    );
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    res.json(plan);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching plan", error: err.message });
  }
});

app.put("/api/plans/:id", async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("landmarks.landmark_id");
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    res.json(plan);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating plan", error: err.message });
  }
});

app.delete("/api/plans/:id", async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    res.json({ message: "Plan deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting plan", error: err.message });
  }
});

// Serve static files
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
