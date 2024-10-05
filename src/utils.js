// utils.js
export const animateTitle = (setTitle) => {
  const titleStages = [
    "Chatbot TIA", 
    "Chatbot TegIA",
    "Chatbot TecgIA",
    "Chatbot TecngIA",
    "Chatbot TecnogIA",
    "Chatbot TecnoogIA",
    "Chatbot TecnologIA", 
    "Chatbot TecnologIA",  // Aquí queremos la pausa
    "Chatbot TecnoogIA ", 
    "Chatbot TecnogIA", 
    "Chatbot TecngIA", 
    "Chatbot TecgIA", 
    "Chatbot TegIA",
    "Chatbot TIA"
  ];

  let baseTime = 100;  // Tiempo estándar entre transiciones
  let totalTime = 0;   // Tiempo acumulado para programar cada transición

  titleStages.forEach((stage, index) => {
    // Si estamos en "Chatbot TecnologIA", añadimos un delay extra
    let delay = baseTime;
    if (stage === "Chatbot TecnoogIA ") {
      delay = 1000;  // Mantener la pausa en "Chatbot TecnologIA" durante 1 segundo
    }

    // Acumular el tiempo total antes de programar la transición
    totalTime += delay;

    // Programar el cambio del título
    setTimeout(() => {
      setTitle(stage);
    }, totalTime);
  });
};
