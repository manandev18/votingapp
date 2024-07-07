const express = require("express");
const router = express.Router();
const Candidate = require("../models/candidate");
const User = require("../models/user");
const { jwtAuthMiddleware, generateToken } = require("../jwt");
// const User = require("../models/user");

const checkadminrole = async function (userid) {
  try {
    const user = await User.findById(userid);
    if (user.role == "admin") {
      return true;
    }
  } catch (err) {
    return false;
  }
};
router.post("/", jwtAuthMiddleware, async (req, res) => {
  try {
    const userid = req.user.id;
    if (!(await checkadminrole(userid))) {
      return res.status(401).json({ error: "Role is invalid" });
    }

    const data = req.body;
    const candidate = new Candidate(data);
    const response = await candidate.save();
    console.log("data saved");
    res.status(200).json({ message: "Candidate registered" });
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal server error");
  }
});

router.put("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!checkadminrole(req.user.id))
      return res.status(403).json({ message: "user does not have admin role" });

    const candidateID = req.params.candidateID; // Extract the id from the URL parameter
    const updatedCandidateData = req.body; // Updated data for the person

    const response = await Candidate.findByIdAndUpdate(
      candidateID,
      updatedCandidateData,
      {
        new: true, // Return the updated document
        runValidators: true, // Run Mongoose validation
      }
    );

    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    console.log("candidate data updated");
    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!checkadminrole(req.user.id))
      return res.status(403).json({ message: "user does not have admin role" });

    const candidateID = req.params.candidateID; // Extract the id from the URL parameter

    const response = await Candidate.findByIdAndDelete(candidateID);

    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    console.log("candidate deleted");
    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/vote/:candidateid", jwtAuthMiddleware, async (req, res) => {
  const candidateid = req.params.candidateid;
  const userid = req.user.id;
  try {
    const candidate = await Candidate.findById(candidateid);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    if (user.role == "admin") {
      return res.status(403).json({ message: "admin is not allowed" });
    }
    if (user.isVoted) {
      return res.status(400).json({ message: "You have already voted" });
    }

    candidate.votes.push({ user: userid });
    candidate.voteCount++;
    await candidate.save();

    // update the user document
    user.isVoted = true;
    await user.save();

    return res.status(200).json({ message: "Vote recorded successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/vote/count", async (req, res) => {
  try {
    // Find all candidates and sort them by voteCount in descending order
    const candidate = await Candidate.find().sort({ voteCount: "desc" });

    // Map the candidates to only return their name and voteCount
    const voteRecord = candidate.map((data) => {
      return {
        party: data.party,
        count: data.voteCount,
      };
    });

    return res.status(200).json(voteRecord);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    // Find all candidates and select only the name and party fields, excluding _id
    const candidates = await Candidate.find({}, "name party -_id");

    // Return the list of candidates
    res.status(200).json(candidates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
