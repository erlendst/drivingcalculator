import React, { useState, useEffect } from "react";

const MS_PER_HOUR = 3600000;

/**
 * Lager en dato ut fra en klokkeslett-streng (HH:mm)
 * Brukes kun til å regne tidsforskjeller.
 */
const lagDatoFraTid = (tid) => new Date(`1970-01-01T${tid}:00Z`);

/**
 * Regner forskjellen i timer mellom to klokkeslett.
 */
const timerMellom = (startTid, sluttTid) => {
  const start = lagDatoFraTid(startTid);
  const slutt = lagDatoFraTid(sluttTid);
  return (slutt.getTime() - start.getTime()) / MS_PER_HOUR;
};

/**
 * Konverterer minutter til timer (desimal).
 */
const minutterTilTimer = (minutter) => {
  const min = parseInt(String(minutter ?? 0), 10) || 0;
  return min / 60;
};

/**
 * Runder opp til nærmeste kvarter (0,25t).
 * Negativt eller null gir 0.
 */
const rundOppTilNesteKvarter = (timer) => {
  if (timer <= 0) return 0;
  return Math.ceil(timer * 4) / 4;
};

/**
 * Viser timer som kort tekst, f.eks. "1,25t".
 */
const formaterTimerKort = (timer) => {
  const safe = Math.max(timer, 0);
  const avrundet = Math.round(safe * 100) / 100;
  const str = avrundet.toString().replace(".", ",");
  return `${str}t`;
};

const TimeCalculator = () => {
  // Inndata (tidspunkter)
  const [startTime, setStartTime] = useState("08:00");
  const [arrivalTime, setArrivalTime] = useState("09:30");
  const [returnStartTime, setReturnStartTime] = useState("14:30");
  const [returnArrivalTime, setReturnArrivalTime] = useState("16:00");

  // Inndata (minutter)
  const [ekstraJobbMinutter, setEkstraJobbMinutter] = useState(0);
  const [lunsjMinutter, setLunsjMinutter] = useState(30);

  // Beregnede verdier i timer (desimal)
  const [totalReisetidTimer, setTotalReisetidTimer] = useState(0);
  const [reisetidUtoverForsteTime, setReisetidUtoverForsteTime] = useState(0);
  const [arbeidstidTimer, setArbeidstidTimer] = useState(0);
  const [lunsjTimer, setLunsjTimer] = useState(0);
  const [ekstraJobbTimer, setEkstraJobbTimer] = useState(0);
  const [jobbTidEtterLunsjTimer, setJobbTidEtterLunsjTimer] = useState(0);
  const [krtTimer, setKrtTimer] = useState(0);
  const [intTimer, setIntTimer] = useState(0);

  const [rundOppTilKvarter, setRundOppTilKvarter] = useState(true);

  // Total reisetid i minutter – brukes for å begrense "ekstra jobbing i bilen"
  const maksEkstraJobbMinutter = Math.max(
    0,
    Math.round(totalReisetidTimer * 60)
  );

  useEffect(() => {
    beregnTid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    startTime,
    arrivalTime,
    returnStartTime,
    returnArrivalTime,
    ekstraJobbMinutter,
    lunsjMinutter,
    rundOppTilKvarter,
  ]);

  /**
   * Hovedberegning av reisetid, jobbtid, og fordeling på KRT / INT.
   *
   * Viktige prinsipper:
   * - Vanlig reisevei (inntil 1t) er i utgangspunktet ikke førbar.
   * - Ekstra reisetid utover vanlig reisevei fordeles på KRT/INT.
   * - Ekstra jobbing i bilen:
   *    1) Spiser først av INT (omfordeling, ingen ekstra timer totalt)
   *    2) Kan deretter gjøre vanlig reisevei om til førbar tid (maks inntil vanlig reisevei)
   *    3) Gir aldri flere totaltimer enn faktisk dag (start → hjem) minus lunsj.
   */
  const beregnTid = () => {
    // Reisetid fram og tilbake
    const utreiseTimer = timerMellom(startTime, arrivalTime);
    const hjemreiseTimer = timerMellom(returnStartTime, returnArrivalTime);
    const totalReiseTimer = utreiseTimer + hjemreiseTimer;

    // Hele dagen fra man drar til man er hjemme igjen
    const totalDagTimer = timerMellom(startTime, returnArrivalTime);

    // Hvor mye av reisetiden som er "vanlig reisevei" (maks 1t, men aldri mer enn total reise)
    const vanligReiseveiTimer = Math.min(totalReiseTimer, 1);

    // Reisetid utover vanlig reisevei – dette er grunnlaget for KRT/INT-reisetid
    const reiseEtterVanligReiseveiTimer = Math.max(
      totalReiseTimer - vanligReiseveiTimer,
      0
    );

    // Jobbtid på stedet (mellom ankomst og avreise)
    const arbeidstid = timerMellom(arrivalTime, returnStartTime);

    // Lunsj og ekstra jobbing i timer
    const lunsjISystemTimer = minutterTilTimer(lunsjMinutter);
    const ekstraJobbISystemTimer = minutterTilTimer(ekstraJobbMinutter);

    // Jobbtid etter at lunsj er trukket fra
    const jobbEtterLunsj = arbeidstid - lunsjISystemTimer;

    // Fordel reisetid utover vanlig reisevei:
    // - Inntil 1t på KRT
    // - Resten på INT
    const krtReiseTimer = Math.min(reiseEtterVanligReiseveiTimer, 1);
    const intReiseTimer = Math.max(
      reiseEtterVanligReiseveiTimer - krtReiseTimer,
      0
    );

    // --- Ekstra jobbing i bilen ---

    // 1) Først spiser ekstra jobbing av INT-reise (bare omfordeling, ingen ekstra totaltid)
    const ekstraJobbSomSpiserINTTimer = Math.min(
      intReiseTimer,
      ekstraJobbISystemTimer
    );
    const ekstraJobbEtterINTTimer = Math.max(
      ekstraJobbISystemTimer - ekstraJobbSomSpiserINTTimer,
      0
    );

    // 2) Deretter kan ekstra jobbing gjøre "vanlig reisevei" om til førbar tid
    //    Men aldri mer enn det som faktisk er vanlig reisevei.
    const ekstraJobbSomGirNyTidTimer = Math.min(
      ekstraJobbEtterINTTimer,
      vanligReiseveiTimer
    );

    // Oppdatert INT-reisetid etter at noe er "spist opp" av ekstra jobbing
    const justertIntReiseTimer = intReiseTimer - ekstraJobbSomSpiserINTTimer;

    // KRT får:
    // - jobbtid etter lunsj
    // - reisetid (KRT-del)
    // - ekstra jobbing som har spist av INT
    // - ekstra jobbing som gjør vanlig reisevei om til arbeidstid
    const krtUtenAvrunding =
      jobbEtterLunsj +
      krtReiseTimer +
      ekstraJobbSomSpiserINTTimer +
      ekstraJobbSomGirNyTidTimer;

    // INT får kun reisetid som gjenstår etter at ekstra jobbing har spist av den
    const intUtenAvrunding = justertIntReiseTimer;

    // Øvre grense: du kan aldri føre mer enn faktisk tid borte minus lunsj
    const maksFørbarTidTimer = Math.max(totalDagTimer - lunsjISystemTimer, 0);

    let krtJustert = Math.max(krtUtenAvrunding, 0);
    let intJustert = Math.max(intUtenAvrunding, 0);

    const sumFørbarUtenAvrunding = krtJustert + intJustert;

    if (sumFørbarUtenAvrunding > maksFørbarTidTimer) {
      // Trekk først fra KRT, siden det er der ekstra jobbing i bilen slår inn
      const overskytende = sumFørbarUtenAvrunding - maksFørbarTidTimer;
      krtJustert = Math.max(krtJustert - overskytende, 0);
      // Skulle det fortsatt være igjen noe (teoretisk), trekker vi også fra INT
      const nySum = krtJustert + intJustert;
      if (nySum > maksFørbarTidTimer) {
        const resterende = nySum - maksFørbarTidTimer;
        intJustert = Math.max(intJustert - resterende, 0);
      }
    }

    const endeligKRT = rundOppTilKvarter
      ? rundOppTilNesteKvarter(krtJustert)
      : krtJustert;

    const endeligINT = rundOppTilKvarter
      ? rundOppTilNesteKvarter(intJustert)
      : intJustert;

    // Oppdater state med alle delverdier
    setTotalReisetidTimer(totalReiseTimer);
    setReisetidUtoverForsteTime(reiseEtterVanligReiseveiTimer);
    setArbeidstidTimer(arbeidstid);
    setLunsjTimer(lunsjISystemTimer);
    setEkstraJobbTimer(ekstraJobbISystemTimer);
    setJobbTidEtterLunsjTimer(jobbEtterLunsj);
    setKrtTimer(endeligKRT);
    setIntTimer(endeligINT);
  };

  // Verdier for å forklare INT-raden visuelt
  // (det som gjenstår av reisetid etter at KRT har fått sin del)
  const intReisetidGrunnlagTimer = Math.max(
    reisetidUtoverForsteTime - Math.min(reisetidUtoverForsteTime, 1),
    0
  );
  const ekstraJobbSomErFlyttetFraINT = Math.min(
    intReisetidGrunnlagTimer,
    ekstraJobbTimer
  );

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
                  value={lunsjMinutter === null ? "" : lunsjMinutter}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setLunsjMinutter(null);
                      return;
                    }
                    setLunsjMinutter(Number(raw));
                  }}
                  onBlur={() => {
                    let num = parseInt(String(lunsjMinutter ?? 0), 10) || 0;
                    num = Math.max(0, num);
                    setLunsjMinutter(num);
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
                  value={ekstraJobbMinutter === null ? "" : ekstraJobbMinutter}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setEkstraJobbMinutter(null);
                      return;
                    }
                    let value = parseInt(raw, 10);
                    if (Number.isNaN(value)) value = 0;

                    // Ikke la ekstra jobbing overstige total reisetid i minutter
                    value = Math.max(
                      0,
                      Math.min(value, maksEkstraJobbMinutter)
                    );

                    setEkstraJobbMinutter(value);
                  }}
                  onBlur={() => {
                    let num =
                      parseInt(String(ekstraJobbMinutter ?? 0), 10) || 0;
                    num = Math.max(0, num);
                    if (num > maksEkstraJobbMinutter) {
                      num = maksEkstraJobbMinutter;
                    }
                    setEkstraJobbMinutter(num);
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
                <div>+{formaterTimerKort(jobbTidEtterLunsjTimer)} jobbtid</div>
                <div>-{formaterTimerKort(lunsjTimer)} lunsj</div>
                <div>
                  -{formaterTimerKort(Math.min(totalReisetidTimer, 1))} normal
                  reisevei
                </div>
                <div>+{formaterTimerKort(ekstraJobbTimer)} ekstra jobbing</div>
                <div>
                  +{formaterTimerKort(Math.min(reisetidUtoverForsteTime, 1))}{" "}
                  reisetid
                </div>
              </div>
              <span>{formaterTimerKort(krtTimer)}</span>
            </div>

            <div className="tableRow">
              <p className="firstColumn">INT5153</p>
              <div className="grunnlagINT">
                <div>
                  +{formaterTimerKort(intReisetidGrunnlagTimer)} ekstra reisetid
                </div>
                <div>
                  {ekstraJobbSomErFlyttetFraINT > 0 && (
                    <i>
                      {"("}
                      {formaterTimerKort(ekstraJobbSomErFlyttetFraINT)} ekstra
                      jobbtid er flyttet til KRT{")"}
                    </i>
                  )}
                </div>
              </div>
              <span>{formaterTimerKort(intTimer)}</span>
            </div>

            <div className="roundingToggle">
              <label>
                Rund opp til nærmeste kvarter
                <input
                  type="checkbox"
                  checked={rundOppTilKvarter}
                  onChange={(e) => setRundOppTilKvarter(e.target.checked)}
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
