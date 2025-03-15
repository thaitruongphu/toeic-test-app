import {Grid, Tab, Tabs} from "@mui/material";
import React, { useState, useEffect } from "react";
import { Container, Typography, Button, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from "@mui/material";

function App() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [correctAnswers, setCorrectAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [selectedPart, setSelectedPart] = useState("PART I");

  useEffect(() => {
    // Load Questions from text file
    fetch("/Test1.txt")
        .then((res) => res.text())
        .then((text) => {
          const parsedQuestions = parseQuestions(text);
          setQuestions(parsedQuestions);
        });

    // Load Correct Answers from text file
    fetch("/Test1_key.txt")
        .then((res) => res.text())
        .then((text) => {
          const parsedAnswers = parseAnswers(text);
          setCorrectAnswers(parsedAnswers);
        });
  }, []);


  const parseQuestions = (text) => {
    const lines = text.split("\n");
    let parsed = [];
    let currentQuestion = null;
    let currentPart = "";

    lines.forEach((line) => {
      // ✅ Detecting parts correctly
      if (/^PART\s(I|II|III|IV)/.test(line.trim())) {
        currentPart = line.trim();
        console.log(`Detected Section: ${currentPart}`); // Debugging log
        return;
      }

      const questionMatch = line.match(/^(\d+)\./);
      const optionMatch = line.match(/^\((A|B|C|D?)\)\s(.+)/);

      if (questionMatch) {
        if (currentQuestion && Object.keys(currentQuestion.options).length > 0) {
          parsed.push(currentQuestion);
        }
        currentQuestion = {
          id: parseInt(questionMatch[1]),
          question: (currentPart === "PART III" || currentPart === "PART IV")
              ? questionMatch[2] // ✅ Extract full question for Part III & IV
              : "", // ✅ No question text for Part I & II
          options: {},
          part: currentPart,
        };
      } else if (optionMatch && currentQuestion) {
        currentQuestion.options[optionMatch[1]] = optionMatch[2];
      }
    });

    if (currentQuestion && Object.keys(currentQuestion.options).length > 0) {
      parsed.push(currentQuestion);
    }

    console.log("Final Parsed Questions:", parsed); // ✅ Debugging Log
    return parsed;
  };





  // Function to parse answers from text format
  const parseAnswers = (text) => {
    let answers = {};
    text.split("\n").forEach((line) => {
      const match = line.match(/^\s*(\d+)\.\s*([A-D])\s*$/);
      if (match) answers[match[1]] = match[2];
    });
    return answers;
  };

  const handleChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleTabChange = (event, newValue) => {
    setSelectedPart(newValue);
  };

  const handleSubmit = () => {
    let totalScore = 0;

    console.log("Questions:", questions);
    console.log("User Answers:", answers);
    console.log("Correct Answers:", correctAnswers);

    questions.forEach((q) => {
      let userAnswer = answers[q.id]; // Get the user's selected answer
      let correctAnswer = correctAnswers[q.id]; // Get the correct answer

      console.log(`Q${q.id}: User Answer = ${userAnswer}, Correct Answer = ${correctAnswer}`);

      if (userAnswer && userAnswer.trim() === correctAnswer?.trim()) {
        totalScore++; // Only count if answer exists and is correct
      }
    });

    console.log("Final Score:", totalScore);
    setScore(totalScore);
  };
// Debugging logs before return
  console.log("📌 Current Selected Part:", selectedPart);
  console.log("📌 All Questions:", questions);
  console.log("📌 Filtered Questions:", questions.filter((q) => q.part === selectedPart));

  return (
      <Container>
        <Typography variant="h4" gutterBottom>TOEIC Practice Test</Typography>

        {/* 🔹 Add Tabs for Part I - IV */}
        <Tabs value={selectedPart} onChange={handleTabChange}>
          <Tab label="Part I" value="PART I" />
          <Tab label="Part II" value="PART II" />
          <Tab label="Part III" value="PART III" />
          <Tab label="Part IV" value="PART IV" />
        </Tabs>

        {/* Debugging UI */}
        <Typography variant="subtitle1" color="primary">
          Current Part: {selectedPart} | Total Questions: {questions.length} | Filtered: {questions.filter((q) => q.part === selectedPart).length}
        </Typography>

        <Grid container spacing={3}>
          {questions
              .filter((q) => q.part === selectedPart) // ✅ Show only the selected part
              .map((q) => (
                  <Grid item xs={12} sm={6} md={4} key={q.id}>
                    <FormControl component="fieldset" style={{ marginBottom: "20px" }}>
                      <FormLabel component="legend" style={{ fontWeight: "bold" }}>
                        {q.id}.
                      </FormLabel>
                      <RadioGroup onChange={(e) => handleChange(q.id, e.target.value)}>
                        {Object.entries(q.options).map(([key, value]) => (
                            <FormControlLabel key={key} value={key} control={<Radio />} label={value} />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Grid>
              ))}
        </Grid>

        <Button variant="contained" color="primary" onClick={handleSubmit} style={{ marginTop: "20px" }}>
          Submit
        </Button>

        {score !== null && (
            <Typography variant="h5" style={{ marginTop: "20px" }}>
              Your Score: {score} / {questions.length}
            </Typography>
        )}
      </Container>
  );

}

export default App;
