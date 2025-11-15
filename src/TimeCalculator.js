import React, { useState, useEffect } from "react";

const TimeCalculator = () => {
  const [startTime, setStartTime] = useState("08:00");
  const [arrivalTime, setArrivalTime] = useState("09:30");
  const [returnStartTime, setReturnStartTime] = useState("14:30");
  const [returnArrivalTime, setReturnArrivalTime] = useState("16:00");
  const [minutesWorking, setMinutesWorking] = useState(0);
  const [minutesLunch, setMinutesLunch] = useState(30);

  // Beregnede verdier i timer (desimal)
  const [totalReisetid, setTotalReisetid] = useState(0);
  const [reiseTidMinusNormaltid, setReiseTidMinusNormaltid] = useState(0);
  const [jobbTid, setJobbTid] = useState(0);
  const [lunsjTid, setLunsjTid] = useState(0);
  const [ekstraJobbTid, setEkstraJobbTid] = useState(0);
  const [totalJobbTid, setTotalJobbTid] = useState(0);
  const [KRTTid, setKRTTid] = useState(0);
  const [INTTid, setINTTid] = useState(0);

  const [roundToQuarter, setRoundToQuarter] = useState(true);

  useEffect(() => {
    beregnTid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    startTime,
    arrivalTime,
    returnStartTime,
    returnArrivalTime,
    minutesWorking,
    minutesLunch,
    roundToQuarter,
  ]);

  const roundToNearestQuarterUp = (hours) => {
    if (hours <= 0) return 0;
    return Math.ceil(hours * 4) / 4;
  };

  const formatHoursShort = (hours) => {
    const safe = Math.max(hours, 0);
    const rounded = Math.round(safe * 100) / 100;
    let str = rounded.toString().replace(".", ",");
    return `${str}t`;
  };

  const beregnTid = () => {
    const msPerHour = 3600000;

    const start = new Date(`2023-01-01T${startTime}:00Z`);
    const arrival = new Date(`2023-01-01T${arrivalTime}:00Z`);
    const returnStart = new Date(`2023-01-01T${returnStartTime}:00Z`);
    const returnArrival = new Date(`2023-01-01T${returnArrivalTime}:00Z`);

    const drivingTime1 = arrival - start;
    const drivingTime2 = returnArrival - returnStart;

    const totalDrivingMs = drivingTime1 + drivingTime2;
    const totalReisetidHours = totalDrivingMs / msPerHour;

    const reiseMinusNormaltidHours = Math.max(totalReisetidHours - 1, 0);

    const jobbTidMs = returnStart - arrival;
    const jobbTidHours = jobbTidMs / msPerHour;

    const lunsjMin = parseInt(minutesLunch, 10) || 0;
    const lunsjHours = lunsjMin / 60;

    const ekstraJobbMin = parseInt(minutesWorking, 10) || 0;
    const ekstraJobbHours = ekstraJobbMin / 60;

    const totalJobbTidHours = jobbTidHours - lunsjHours;

    const krtReiseDel = Math.min(reiseMinusNormaltidHours, 1);
    const intReiseDel = Math.max(reiseMinusNormaltidHours - krtReiseDel, 0);

    const KRTBase = totalJobbTidHours + ekstraJobbHours + krtReiseDel;
    const INTBase = intReiseDel;

    const finalKRT = roundToQuarter
      ? roundToNearestQuarterUp(KRTBase)
      : Math.max(KRTBase, 0);

    const finalINT = roundToQuarter
      ? roundToNearestQuarterUp(INTBase)
      : Math.max(INTBase, 0);

    setTotalReisetid(totalReisetidHours);
    setReiseTidMinusNormaltid(reiseMinusNormaltidHours);
    setJobbTid(jobbTidHours);
    setLunsjTid(lunsjHours);
    setEkstraJobbTid(ekstraJobbHours);
    setTotalJobbTid(totalJobbTidHours);
    setKRTTid(finalKRT);
    setINTTid(finalINT);
  };

  return (
    <div className="calculator">
      <header className="calculatorHeader">
        <h1>Kjøring til Hønefoss</h1>
      </header>

      <main>
        <section className="calculatorSection" aria-label="Kalkuler reise">
          <div className="allInputs">
            <div className="inputColumn">
              <div className="inputContainer">
                <label htmlFor="startTime">Jeg dro hjemmefra</label>
                <div className="inputWithPrefix">
                  <span className="inputPrefix">kl.</span>
                  <input
                    id="startTime"
                    name="startTime"
                    className="timeInputWithPrefix"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="inputContainer">
                <label htmlFor="arrivalTime">Jeg ankom Hønefoss</label>
                <div className="inputWithPrefix">
                  <span className="inputPrefix">kl.</span>
                  <input
                    id="arrivalTime"
                    name="arrivalTime"
                    className="timeInputWithPrefix"
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="inputColumn">
              <div className="inputContainer">
                <label htmlFor="returnStartTime">Jeg dro fra Hønefoss</label>
                <div className="inputWithPrefix">
                  <span className="inputPrefix">kl.</span>
                  <input
                    id="returnStartTime"
                    name="returnStartTime"
                    className="timeInputWithPrefix"
                    type="time"
                    value={returnStartTime}
                    onChange={(e) => setReturnStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="inputContainer">
                <label htmlFor="returnArrivalTime">Jeg kom hjem</label>
                <div className="inputWithPrefix">
                  <span className="inputPrefix">kl.</span>
                  <input
                    id="returnArrivalTime"
                    name="returnArrivalTime"
                    className="timeInputWithPrefix"
                    type="time"
                    value={returnArrivalTime}
                    onChange={(e) => setReturnArrivalTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="line"></div>
          <div className="extraInputsRow">
            <div className="inputContainer">
              <label htmlFor="lunchMinutes">Lunsjpause</label>
              <div className="inputWithSuffix">
                <input
                  id="lunchMinutes"
                  name="lunchMinutes"
                  className="numberInputWithSuffix"
                  type="number"
                  min="0"
                  value={minutesLunch === null ? "" : minutesLunch}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setMinutesLunch(null);
                      return;
                    }
                    setMinutesLunch(raw);
                  }}
                  onBlur={() => {
                    const num = Math.max(0, parseInt(minutesLunch, 10) || 0);
                    setMinutesLunch(num);
                  }}
                />
                <span className="inputSuffix">minutter</span>
              </div>
            </div>

            <div className="inputContainer">
              <label htmlFor="extraWorkMinutes">Ekstra jobbing i bilen</label>
              <div className="inputWithSuffix">
                <input
                  id="extraWorkMinutes"
                  name="extraWorkMinutes"
                  className="numberInputWithSuffix"
                  type="number"
                  min="0"
                  value={minutesWorking === null ? "" : minutesWorking}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setMinutesWorking(null);
                      return;
                    }
                    setMinutesWorking(raw);
                  }}
                  onBlur={() => {
                    const num = Math.max(0, parseInt(minutesWorking, 10) || 0);
                    setMinutesWorking(num);
                  }}
                />
                <span className="inputSuffix">minutter</span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="resultSection"
          aria-label="Forslag til timeføring basert på reiseregler"
        >
          <div className="resultTable">
            <div className="tableRow">
              <p className="firstColumn">Timekode</p>
              <p className="desktopColumn">Grunnlag</p>
              <p>Resultat</p>
            </div>
            <div className="tableRow">
              <p className="firstColumn">KRT-kode</p>
              <div className="grunnlagKRT">
                <div>+{formatHoursShort(totalJobbTid)} jobbtid</div>
                <div>-{formatHoursShort(lunsjTid)} lunsj</div>
                <div>
                  -{formatHoursShort(Math.min(totalReisetid, 1))} normal
                  reisevei
                </div>
                <div>+{formatHoursShort(ekstraJobbTid)} ekstra jobbing</div>
                <div>
                  +{formatHoursShort(Math.min(reiseTidMinusNormaltid, 1))}{" "}
                  reisetid
                </div>
              </div>
              <span>{formatHoursShort(KRTTid)}</span>
            </div>

            <div className="tableRow">
              <p className="firstColumn">INT5153</p>
              <div className="grunnlagINT">
                <div>
                  +{formatHoursShort(Math.max(reiseTidMinusNormaltid - 1, 0))}{" "}
                  ekstra reisetid
                </div>
              </div>
              <span>{formatHoursShort(INTTid)}</span>
            </div>
            <div className="roundingToggle">
              <label>
                Rund opp til nærmeste kvarter
                <input
                  type="checkbox"
                  checked={roundToQuarter}
                  onChange={(e) => setRoundToQuarter(e.target.checked)}
                />
              </label>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TimeCalculator;
