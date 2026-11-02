"use strict";

document.addEventListener("DOMContentLoaded", function () {
const examSelect = document.getElementById("question-exam");
const questionForm = document.getElementById("question-form");
const message = document.getElementById("question-message");


function getExams() {
    try {
        const data = JSON.parse(localStorage.getItem("exams") || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("خطأ في قراءة الامتحانات:", error);
        return [];
    }
}

function showMessage(text, success) {
    message.textContent = text;
    message.style.color = success ? "green" : "red";
}

const exams = getExams();

exams.forEach(function (exam, index) {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = exam.name || "امتحان بدون اسم";
    examSelect.appendChild(option);
});

if (exams.length === 0) {
    showMessage("لا توجد امتحانات. أنشئ امتحانًا أولًا.", false);
}

questionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const currentExams = getExams();
    const examIndex = Number(examSelect.value);

    if (
        examSelect.value === "" ||
        !Number.isInteger(examIndex) ||
        examIndex < 0 ||
        examIndex >= currentExams.length
    ) {
        showMessage("يرجى اختيار امتحان صحيح.", false);
        return;
    }

    const question = {
        id: Date.now(),
        text: document.getElementById("question-text").value.trim(),
        options: {
            a: document.getElementById("option-a").value.trim(),
            b: document.getElementById("option-b").value.trim(),
            c: document.getElementById("option-c").value.trim(),
            d: document.getElementById("option-d").value.trim()
        },
        correctAnswer: document.getElementById("correct-answer").value
    };

    if (!question.text) {
        showMessage("يرجى كتابة نص السؤال.", false);
        return;
    }

    const exam = currentExams[examIndex];

    if (!Array.isArray(exam.questions)) {
        exam.questions = [];
    }

    exam.questions.push(question);

    try {
        localStorage.setItem("exams", JSON.stringify(currentExams));

        showMessage("تم حفظ السؤال بنجاح.", true);
        questionForm.reset();
        examSelect.value = String(examIndex);

        console.log("تم حفظ السؤال في الامتحان:", exam.name);
    } catch (error) {
        console.error("تعذر حفظ السؤال:", error);
        showMessage("تعذر الحفظ. تحقق من مساحة التخزين.", false);
    }
});

});
