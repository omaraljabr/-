"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const examTitle = document.getElementById("exam-title");
    const studentName = document.getElementById("student-name");

    const questionNumber = document.getElementById("question-number");
    const questionCount = document.getElementById("question-count");

    const progressBar = document.getElementById("progress-bar");
    const questionText = document.getElementById("question-text");

    const optionsContainer = document.getElementById("options-container");
    const questionMessage = document.getElementById("question-message");

    const previousButton = document.getElementById("previous-button");
    const nextButton = document.getElementById("next-button");
    const submitButton = document.getElementById("submit-button");

    const examCard = document.getElementById("exam-card");
    const resultCard = document.getElementById("result-card");

    const resultStudent = document.getElementById("result-student");
    const resultScore = document.getElementById("result-score");
    const resultDetails = document.getElementById("result-details");

    let student = null;
    let exam = null;
    let examIndex = -1;
    let questions = [];

    let currentQuestionIndex = 0;

    const answers = {};

    function stopWithMessage(message) {

        examCard.hidden = true;
        resultCard.hidden = false;

        resultCard.querySelector("h2").textContent = message;

        resultStudent.textContent =
            "يرجى العودة إلى صفحة اختيار الاختبارات والمحاولة مرة أخرى.";

        resultCard.querySelector(".result-icon").hidden = true;
        resultCard.querySelector(".score-box").hidden = true;
        resultCard.querySelector(".result-note").hidden = true;
    }

    try {

        student = JSON.parse(
            sessionStorage.getItem("currentStudent") || "null"
        );

        const savedIndex = sessionStorage.getItem("currentExamIndex");

        const storedExams = JSON.parse(
            localStorage.getItem("exams") || "[]"
        );

        if (
            !student ||
            !student.fullName ||
            savedIndex === null ||
            !Array.isArray(storedExams)
        ) {
            stopWithMessage("تعذر تحميل بيانات الاختبار");
            return;
        }

        examIndex = Number(savedIndex);

        if (
            !Number.isInteger(examIndex) ||
            examIndex < 0 ||
            examIndex >= storedExams.length
        ) {
            stopWithMessage("رقم الاختبار غير صحيح");
            return;
        }

        exam = storedExams[examIndex];

        if (
            !exam ||
            exam.hidden === true ||
            !Array.isArray(exam.questions) ||
            exam.questions.length === 0
        ) {
            stopWithMessage("الاختبار غير متاح");
            return;
        }

        questions = exam.questions;

    } catch (error) {

        console.error("خطأ أثناء تحميل الاختبار:", error);

        stopWithMessage("حدث خطأ أثناء تحميل الاختبار");

        return;
    }
    // منع نفس الإيميل والجوال من دخول الاختبار أكثر من مرة
    const attemptId =
        (student.email || "").trim().toLowerCase() + "|" +
        (student.phone || "").trim() + "|" +
        examIndex;

    let attempts = [];

    try {
        attempts = JSON.parse(localStorage.getItem("examAttempts") || "[]");
    } catch (error) {
        attempts = [];
    }

    if (!Array.isArray(attempts)) {
        attempts = [];
    }

    if (attempts.includes(attemptId)) {
        stopWithMessage("لقد دخلت هذا الاختبار من قبل ولا يمكنك إعادته");
        return;
    }

    attempts.push(attemptId);
    localStorage.setItem("examAttempts", JSON.stringify(attempts));
    examTitle.textContent = exam.name || "اختبار بدون اسم";

    studentName.textContent = "الطالب: " + student.fullName;

    questionCount.textContent = "من " + questions.length;

    function getOptions(question) {

        if (
            !question.options ||
            typeof question.options !== "object"
        ) {
            return [];
        }

        return Object.entries(question.options).filter(
            ([key, value]) =>
                ["a", "b", "c", "d"].includes(key) &&
                value !== null &&
                value !== undefined &&
                String(value).trim() !== ""
        );
    }

    function renderQuestion() {

        const question = questions[currentQuestionIndex];

        questionNumber.textContent =
            "السؤال " + (currentQuestionIndex + 1);

        questionCount.textContent =
            "من " + questions.length;

        progressBar.style.width =
            ((currentQuestionIndex + 1) / questions.length * 100) + "%";

        questionText.textContent =
            question.text || "نص السؤال غير متوفر";

        optionsContainer.replaceChildren();

        questionMessage.textContent = "";

        const options = getOptions(question);

        if (options.length === 0) {

            questionMessage.textContent =
                "لا توجد خيارات صالحة لهذا السؤال. يرجى مراجعة المسؤول.";

            nextButton.disabled = true;
            submitButton.disabled = true;

            previousButton.disabled = currentQuestionIndex === 0;

            nextButton.hidden = true;
            submitButton.hidden = true;

            return;
        }

        nextButton.disabled = false;
        submitButton.disabled = false;

        options.forEach(([key, value]) => {

            const label = document.createElement("label");

            label.className = "option-label";

            const input = document.createElement("input");

            input.type = "radio";

            input.name = "question-" + currentQuestionIndex;

            input.value = key;

            input.checked =
                answers[currentQuestionIndex] === key;

            input.addEventListener("change", () => {

                answers[currentQuestionIndex] = key;

                questionMessage.textContent = "";

            });

            const text = document.createElement("span");

            text.textContent = String(value);

            label.appendChild(input);
            label.appendChild(text);

            optionsContainer.appendChild(label);

        });

        previousButton.disabled = currentQuestionIndex === 0;

        const isLastQuestion =
            currentQuestionIndex === questions.length - 1;

        nextButton.hidden = isLastQuestion;

        submitButton.hidden = !isLastQuestion;
    }

    nextButton.addEventListener("click", () => {

        if (answers[currentQuestionIndex] === undefined) {

            questionMessage.textContent =
                "يرجى اختيار إجابة قبل المتابعة.";

            return;
        }

        if (currentQuestionIndex < questions.length - 1) {

            currentQuestionIndex++;

            renderQuestion();
        }
    });

    previousButton.addEventListener("click", () => {

        if (currentQuestionIndex > 0) {

            currentQuestionIndex--;

            renderQuestion();
        }
    });

    submitButton.addEventListener("click", () => {

        const unanswered = questions.findIndex(
            (_, index) => answers[index] === undefined
        );

        if (unanswered !== -1) {

            const shouldGoToQuestion = confirm(
                "لم تجب عن جميع الأسئلة. هل تريد الانتقال إلى أول سؤال لم تجب عنه؟"
            );

            if (shouldGoToQuestion) {

                currentQuestionIndex = unanswered;

                renderQuestion();
            }

            return;
        }

        const confirmed = confirm(
            "هل أنت متأكد من تسليم الاختبار؟ لن تتمكن من تعديل إجاباتك بعد التسليم."
        );

        if (!confirmed) {
            return;
        }

        finishExam();
    });

    function finishExam() {

        let correct = 0;

        questions.forEach((question, index) => {

            const correctAnswer = String(
                question.correctAnswer || ""
            ).trim().toLowerCase();

            const studentAnswer = String(
                answers[index] || ""
            ).trim().toLowerCase();

            if (
                correctAnswer !== "" &&
                studentAnswer === correctAnswer
            ) {
                correct++;
            }
        });

        const percentage = Math.round(
            (correct / questions.length) * 100
        );

        const result = {

            studentName: student.fullName,

            email: student.email || "",

            phone: student.phone || "",

            examName: exam.name || "اختبار بدون اسم",

            examIndex: examIndex,

            totalQuestions: questions.length,

            correctAnswers: correct,

            wrongAnswers: questions.length - correct,

            percentage: percentage,

            answers: questions.map((question, index) => ({

                question: question.text || "",

                selectedAnswer: answers[index] || "",

                correctAnswer: String(
                    question.correctAnswer || ""
                )

            })),

            submittedAt: new Date().toISOString()
        };

        try {

            const previousResults = JSON.parse(
                localStorage.getItem("examResults") || "[]"
            );

            if (!Array.isArray(previousResults)) {
                throw new Error("بيانات النتائج غير صحيحة");
            }

            previousResults.push(result);

            localStorage.setItem(
                "examResults",
                JSON.stringify(previousResults)
            );

        } catch (error) {

            console.error("تعذر حفظ النتيجة:", error);

            alert(
                "تعذر حفظ النتيجة. يرجى إبلاغ المسؤول."
            );

            return;
        }

        examCard.hidden = true;

        resultCard.hidden = false;

        resultStudent.textContent =
            student.fullName + " — " + (exam.name || "الاختبار");

        resultScore.textContent = percentage + "%";

        const showResult = exam.showResult === "yes" || exam.showResult === true;

if (showResult) {
    resultScore.textContent = percentage + "%";
} else {
    resultScore.textContent = "تم الاستلام";
    resultDetails.textContent = "تم تسجيل إجاباتك، وسيعلن المسؤول النتيجة لاحقاً.";
}
        sessionStorage.removeItem("currentExamIndex");
    }

    renderQuestion();

});