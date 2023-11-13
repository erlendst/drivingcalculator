import React, { useState, useEffect } from "react";

const TimeCalculator = () => {
  const [startTime, setStartTime] = useState("07:30");
  const [arrivalTime, setArrivalTime] = useState("08:30");
  const [returnStartTime, setReturnStartTime] = useState("15:00");
  const [returnArrivalTime, setReturnArrivalTime] = useState("16:00");
  const [minutesWorking, setMinutesWorking] = useState("30");
  const [minutesLunch, setMinutesLunch] = useState(30); // Default value of 30 minutes for lunch
  const [roundedDecimalTime, setRoundedDecimalTime] = useState(0);
  const [roundedDecimalTimeDriving, setRoundedDecimalTimeDriving] = useState(0);
  const [timeSpentDriving, setTimeSpentDriving] = useState("");
  const [timeSpentWorking, setTimeSpentWorking] = useState("");

  useEffect(() => {
    // Calculate the time whenever there is a change in the input values
    calculateTime();
  }, [
    startTime,
    arrivalTime,
    returnStartTime,
    returnArrivalTime,
    minutesWorking,
    minutesLunch,
  ]); // Dependency array includes all input values

  const calculateTime = () => {
    // Perform your calculations here based on the inputs
    // You can use JavaScript Date objects to handle time operations

    // Example: Convert string times to Date objects
    const start = new Date(`2023-01-01T${startTime}:00Z`);
    const arrival = new Date(`2023-01-01T${arrivalTime}:00Z`);
    const returnStart = new Date(`2023-01-01T${returnStartTime}:00Z`);
    const returnArrival = new Date(`2023-01-01T${returnArrivalTime}:00Z`);

    // Example: Calculate total time spent driving
    const drivingTime1 = arrival - start;
    const drivingTime2 = returnArrival - returnStart;

    // Subtract minutes working while driving from total driving time
    const totalDrivingTime =
      drivingTime1 + drivingTime2 - parseInt(minutesWorking) * 60000;

    // Calculate half of the time spent driving
    const halfDrivingTime = totalDrivingTime / 2;

    // Example: Calculate time spent working (add half of driving time)
    let workingTime =
      returnStart -
      arrival +
      parseInt(minutesWorking) * 60000 +
      halfDrivingTime;

    // Subtract lunch break duration from working time
    workingTime -= minutesLunch * 60000;

    // Example: Format results
    setTimeSpentDriving(formatTime(halfDrivingTime));
    const calculatedRoundedDecimalTimeDriving =
      calculateRoundedDecimalTime(halfDrivingTime);
    setRoundedDecimalTimeDriving(calculatedRoundedDecimalTimeDriving);

    // Calculate rounded decimal time based on working time, not driving time
    const calculatedRoundedDecimalTime =
      calculateRoundedDecimalTime(workingTime);
    setRoundedDecimalTime(calculatedRoundedDecimalTime);
    setTimeSpentWorking(formatTime(workingTime));
  };

  const calculateRoundedDecimalTime = (milliseconds) => {
    const decimalTime = milliseconds / 3600000;
    // Round up to the nearest 0.25
    return Math.ceil(decimalTime * 4) / 4;
  };

  const formatTime = (milliseconds) => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);

    return `${hours} timer og ${minutes} minutter`;
  };

  return (
    <div className="calculator">
      <div className="headlines">
        <h1>– Hjelp, jeg skal føre timer for reising til Hønefoss! 🚗💨</h1>
        <p>
          Bruk mer tid på jobb og mindre tid på hoderegning med denne enkle
          timekalkulatoren 😎{" "}
        </p>
        <p className="additionalInfo">
          Kjøretiden blir fordelt 50/50 mellom prosjekt og reisetid.
        </p>
      </div>
      <div className="inputSection">
        <div>
          <label>Vi startet å kjøre fra Oslo kl.</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />

          <label>og ankom Hønefoss kl.</label>
          <input
            type="time"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
          />
        </div>
        <div>
          <label>Vi kjørte hjemover igjen kl.</label>
          <input
            type="time"
            value={returnStartTime}
            onChange={(e) => setReturnStartTime(e.target.value)}
          />

          <label>og kom frem til Oslo kl.</label>
          <input
            type="time"
            value={returnArrivalTime}
            onChange={(e) => setReturnArrivalTime(e.target.value)}
          />
        </div>
      </div>
      <div className="inputSection">
        <div>
          <label>Uten mat og drikke duger helten ikke, så jeg hadde</label>
          <input
            type="numeric"
            value={minutesLunch}
            onChange={(e) => setMinutesLunch(e.target.value)}
          />
          <span>minutter med lunsjpause</span>
        </div>
        <div>
          <label>
            Jeg var selvfølgelig en flink konsulent, og jobbet derfor
          </label>
          <input
            type="numeric"
            value={minutesWorking}
            onChange={(e) => setMinutesWorking(e.target.value)}
          />
          <span>minutter i bilen</span>
        </div>
      </div>
      <div className="resultSection">
        <h3>Timeføring</h3>
        <p>
          Du brukte <span className="strongHour">{timeSpentDriving}</span> på
          kjøring. Det betyr at du kan føre{" "}
          <span className="strongHour">{roundedDecimalTimeDriving}</span> på
          reisetid.
        </p>
        <p>
          Du jobbet <span className="strongHour">{timeSpentWorking}</span> {"("}
          lunsj er trukket fra!{")"}. Det betyr at du kan føre{" "}
          <span className="strongHour">{roundedDecimalTime}</span> på prosjekt.
        </p>
        <p className="resultDescription">
          Merk at desimaltiden blir rundet opp til nærmeste kvarter.
        </p>
      </div>
    </div>
  );
};

export default TimeCalculator;
