import { Grid, Tab, Tabs, MenuItem, Select } from "@mui/material";
import React, { useState, useEffect } from "react";
import { Container, Typography, Button, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from "@mui/material";

function App() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [correctAnswers, setCorrectAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [selectedPart, setSelectedPart] = useState("PART I");
  const [selectedTest, setSelectedTest] = useState("Test1"); // Default test

  useEffect(() => {
    if (!selectedTest) return;

    // Load Questions from selected test file
    fetch(`/${selectedTest}.txt`)
        .then((res) => res.text())
        .then((text) => {
          const parsedQuestions = parseQuestions(text);
          setQuestions(parsedQuestions);
        });

    // Load Correct Answers from selected test key file
    fetch(`/${selectedTest}_key.txt`)
        .then((res) => res.text())
        .then((text) => {
          const parsedAnswers = parseAnswers(text);
          setCorrectAnswers(parsedAnswers);
        });
  }, [selectedTest]); // 🔹 Re-fetch when test changes

  const parseQuestions = (text) => {
    const lines = text.split("\n");
    let parsed = [];
    let currentQuestion = null;
    let currentPart = "";

    lines.forEach((line) => {
      const cleanLine = line.replace(/\r/g, "").trim();
      if (!cleanLine) return;

      if (/^PART\s(I|II|III|IV)/.test(cleanLine)) {
        currentPart = cleanLine;
        return;
      }

      const questionMatch = cleanLine.match(/^(\d+)\./);
      if (questionMatch) {
        if (currentQuestion && Object.keys(currentQuestion.options).length > 0) {
          parsed.push(currentQuestion);
        }
        const questionText = cleanLine.replace(/^(\d+)\.\s*/, "").trim();
        currentQuestion = {
          id: parseInt(questionMatch[1]),
          question: currentPart === "PART III" || currentPart === "PART IV" ? questionText : "",
          options: {},
          part: currentPart,
        };
        return;
      }

      const optionMatch = cleanLine.match(/^\((A|B|C|D)\)\s*(.+)$/);
      if (optionMatch && currentQuestion) {
        currentQuestion.options[optionMatch[1]] = optionMatch[2].trim();
      }
    });

    if (currentQuestion && Object.keys(currentQuestion.options).length > 0) {
      parsed.push(currentQuestion);
    }
    return parsed;
  };

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

  const handleTestChange = (event) => {
    setSelectedTest(event.target.value);
    setScore(null); // Reset score when switching tests
  };

  const handleSubmit = () => {
    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    questions.forEach((q) => {
      let userAnswer = answers[q.id] || "-"; // If unanswered, show "-"
      let correctAnswer = correctAnswers[q.id] || "-";

      if (userAnswer !== "-") {
        if (userAnswer.trim() === correctAnswer?.trim()) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      }
    });

    totalScore = correctCount;
    setScore(totalScore);

    // 🔹 Call handleExport to save the record after submitting
    handleExport(correctCount, incorrectCount);
  };


  const handleExport = () => {
    const now = new Date();
    now.setHours(now.getHours() + 7); // Convert to UTC+7

    const formattedDateTime = now
        .toISOString()
        .replace("T", "_")
        .replace(/:/g, "-")
        .split(".")[0]; // Format: YYYY-MM-DD_HH-MM-SS

    let testNumber = selectedTest || "Unknown"; // Ensure test number is set

    let correctCount = 0;
    let incorrectCount = 0;

    let resultText = `📌 TOEIC Test Records\nDatetime: ${now.toLocaleString()} (UTC+7)\nTest Number: ${testNumber}\n\n`;

    questions.forEach((q) => {
      let userAnswer = answers[q.id] || "-"; // If unanswered, show "-"
      let correctAnswer = correctAnswers[q.id] || "-";
      let isCorrect = userAnswer === correctAnswer ? "✔️" : "❌";

      if (userAnswer !== "-") {
        isCorrect === "✔️" ? correctCount++ : incorrectCount++;
      }

      resultText += `Q${q.id} | Your Answer: ${userAnswer} | Key: ${correctAnswer} | Result: ${isCorrect}\n`;
    });

    // 📌 Add summary at the bottom of the file
    resultText += `\n📊 Summary:\n`;
    resultText += `✅ Correct Answers: ${correctCount}\n`;
    resultText += `❌ Incorrect Answers: ${incorrectCount}\n`;
    resultText += `📌 Total Questions Attempted: ${correctCount + incorrectCount}\n`;

    // Create a Blob and download
    const blob = new Blob([resultText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${formattedDateTime}_${testNumber}.txt`; // File name format
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };






  return (
      <Container>
        <Typography variant="h4" gutterBottom>TOEIC Practice Test</Typography>

        {/* 🔹 Dropdown to select a test */}
        <Select value={selectedTest} onChange={handleTestChange} style={{ marginBottom: "20px" }}>
          {Array.from({ length: 11 }, (_, i) => (
              <MenuItem key={i + 1} value={`Test${i + 1}`}>
                Test {i + 1}
              </MenuItem>
          ))}
        </Select>


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
              .filter((q) => q.part === selectedPart)
              .map((q) => (
                  <Grid item xs={12} sm={6} md={4} key={q.id}>
                    <FormControl component="fieldset" style={{ marginBottom: "20px" }}>
                      <FormLabel component="legend" style={{ fontWeight: "bold" }}>
                        {q.id}. {q.question || ""}
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
