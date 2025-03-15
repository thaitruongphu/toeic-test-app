import React, { useState, useEffect } from "react";
import { Container, Typography, Button, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from "@mui/material";

function App() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [correctAnswers, setCorrectAnswers] = useState({});
  const [score, setScore] = useState(null);

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

  // Function to parse questions from text format
  const parseQuestions = (text) => {
    const lines = text.split("\n");
    let parsed = [];
    let currentQuestion = null;

    lines.forEach((line) => {
      const questionMatch = line.match(/^(\d+)\.\s(.+)/);
      const optionMatch = line.match(/^\((A|B|C|D)\)\s(.+)/);

      if (questionMatch) {
        if (currentQuestion) parsed.push(currentQuestion);
        currentQuestion = {
          id: parseInt(questionMatch[1]),
          question: questionMatch[2],
          options: {},
        };
      } else if (optionMatch && currentQuestion) {
        currentQuestion.options[optionMatch[1]] = optionMatch[2];
      }
    });

    if (currentQuestion) parsed.push(currentQuestion);
    return parsed;
  };

  // Function to parse answers from text format
  const parseAnswers = (text) => {
    let answers = {};
    text.split("\n").forEach((line) => {
      const match = line.match(/^(\d+)\.\s([A-D])$/);
      if (match) answers[match[1]] = match[2];
    });
    return answers;
  };

  const handleChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = () => {
    let totalScore = 0;
    questions.forEach((q) => {
      if (answers[q.id] === correctAnswers[q.id]) totalScore++;
    });
    setScore(totalScore);
  };

  return (
      <Container>
        <Typography variant="h4" gutterBottom>TOEIC Practice Test</Typography>

        {questions.length > 0 ? (
            questions.map((q) => (
                <FormControl key={q.id} component="fieldset" style={{ marginBottom: "20px" }}>
                  <FormLabel component="legend">{q.question}</FormLabel>
                  <RadioGroup onChange={(e) => handleChange(q.id, e.target.value)}>
                    {Object.entries(q.options).map(([key, value]) => (
                        <FormControlLabel key={key} value={key} control={<Radio />} label={value} />
                    ))}
                  </RadioGroup>
                </FormControl>
            ))
        ) : (
            <Typography>Loading questions...</Typography>
        )}

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
