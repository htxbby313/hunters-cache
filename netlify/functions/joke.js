/**
 * Netlify Serverless Function: /api/joke
 * Returns a random programming joke as JSON.
 */

const jokes = [
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "How many programmers does it take to change a light bulb? None – that's a hardware problem.",
  "A SQL query walks into a bar, walks up to two tables and asks, 'Can I join you?'",
  "Why do Java developers wear glasses? Because they don't see sharp.",
  "There are 10 types of people in the world: those who understand binary and those who don't.",
  "I would tell you a UDP joke, but you might not get it.",
  "Debugging: Being the detective in a crime movie where you are also the murderer.",
  "Why did the programmer quit his job? He didn't get arrays.",
  "What's a programmer's favorite hangout place? The Foo Bar."
];

export async function handler(event) {
  const randomIndex = Math.floor(Math.random() * jokes.length);
  const body = { joke: jokes[randomIndex] };
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}
