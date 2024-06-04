/** @format */

import { useState, useEffect } from "react";
import "./App.css";
import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { paragraphsYes, paragraphsNo } from "./data";
import ReactGA from "react-ga";

function initializeAnalytics() {
  ReactGA.initialize(process.env.REACT_APP_GA_KEY); // Replace 'YOUR_TRACKING_ID' with your actual GA tracking ID
  ReactGA.pageview(window.location.pathname + window.location.search);
}
function App() {
  const [pollResult, setPollResult] = useState({ yes: 0, no: 0 });
  const [voted, setVoted] = useState(false);
  const [fingerprint, setFingerprint] = useState(null);
  const [selectedParagraph, setSelectedParagraph] = useState("");
  const [carouselParagraphs, setCarouselParagraphs] = useState([
    ...paragraphsYes,
    paragraphsNo,
  ]);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [voteType, setVoteType] = useState(null);

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    // Initialize FingerprintJS and get the visitor ID
    FingerprintJS.load()
      .then((fp) => fp.get())
      .then((result) => {
        const visitorId = result.visitorId;
        setFingerprint(visitorId);
        checkIfVoted(visitorId);
      });

    const pollRef = doc(db, "polls", "pollResult");
    const unsubscribe = onSnapshot(pollRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setPollResult(docSnapshot.data());
      } else {
        setDoc(pollRef, { yes: 0, no: 0 });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentCarouselIndex((currentIndex) =>
        currentIndex < carouselParagraphs.length - 1 ? currentIndex + 1 : 0,
      );
    }, 6000); // Change paragraph every 6 seconds

    return () => clearInterval(intervalId);
  }, [carouselParagraphs]);

  const checkIfVoted = async (visitorId) => {
    const userRef = doc(db, "voters", visitorId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      setVoted(true);
    }
  };

  const handleVote = async (vote) => {
    if (!voted && fingerprint) {
      ReactGA.event({
        category: "Vote",
        action: "User voted",
        label: vote,
      });

      const pollRef = doc(db, "polls", "pollResult");
      const userRef = doc(db, "voters", fingerprint);

      const docSnapshot = await getDoc(pollRef);
      const currentVotes = docSnapshot.exists()
        ? docSnapshot.data()
        : { yes: 0, no: 0 };
      currentVotes[vote] = (currentVotes[vote] || 0) + 1;

      await setDoc(pollRef, currentVotes);
      await setDoc(userRef, { voted: true });

      setVoted(true);
      setVoteType(vote); // Set the vote type to 'yes' or 'no'

      // Select a random paragraph based on the vote
      const paragraphs = vote === "yes" ? paragraphsYes : paragraphsNo;
      const randomIndex = Math.floor(Math.random() * paragraphs.length);
      setSelectedParagraph(paragraphs[randomIndex]);

      // Update the carousel to exclude the selected paragraph
      const remainingParagraphs = paragraphs.filter(
        (_, index) => index !== randomIndex,
      );
      setCarouselParagraphs(remainingParagraphs);
    }
  };

  const totalVotes = pollResult.yes + pollResult.no;
  const yesWidth = totalVotes === 0 ? 50 : (pollResult.yes / totalVotes) * 100;
  const noWidth = totalVotes === 0 ? 50 : (pollResult.no / totalVotes) * 100;

  return (
    <div className="App">
      <header className="App-header">
        <img
          src="konieldo.png"
          alt="Koniec Eldorado"
          width={400}
          height={400}
        />
        <h1>Czy to koniec eldorado?</h1>
        <div className="button-container">
          <button
            className="App-button"
            onClick={() => handleVote("yes")}
            disabled={voted}
          >
            Tak
          </button>
          <button
            className="App-button"
            onClick={() => handleVote("no")}
            disabled={voted}
          >
            Nie
          </button>
        </div>

        {voted && (
          <>
            <div className="results-bar">
              <div className="result yes" style={{ width: `${yesWidth}%` }}>
                {Math.round(yesWidth)}%
              </div>
              <div className="result no" style={{ width: `${noWidth}%` }}>
                {Math.round(noWidth)}%
              </div>
            </div>
          </>
        )}
        <div className="carousel">
          <blockquote>{carouselParagraphs[currentCarouselIndex]}*</blockquote>
        </div>
        <p className="note">*wszystkie teksty zmyślone przez ChatGPT</p>
      </header>
    </div>
  );
}

export default App;
