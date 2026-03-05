const resultData = JSON.parse(sessionStorage.getItem("diagnosisResult"));

if (resultData) {

    const title = document.getElementById("resultTitle");
    const text = document.getElementById("resultText");

    if (title) title.textContent = resultData.title;
    if (text) text.textContent = resultData.text;

}