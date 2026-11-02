
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("student-form");
    const message = document.getElementById("form-message");
    const continueButton = document.getElementById("continue-button");

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();

        message.textContent = "";
        message.className = "form-message";

        if (!fullName || !email || !phone) {
            message.textContent = "يرجى تعبئة جميع البيانات.";
            message.classList.add("error");
            return;
        }

        const student = {
            fullName: fullName,
            email: email,
            phone: phone,
            registeredAt: new Date().toISOString()
        };

        try {
            sessionStorage.setItem(
                "currentStudent",
                JSON.stringify(student)
            );

            continueButton.disabled = true;
            continueButton.textContent = "جارٍ الانتقال...";

          window.location.href = "student-exams/Student-exams1.html";

        } catch (error) {
            console.error("حدث خطأ أثناء حفظ بيانات الطالب:", error);

            message.textContent =
                "تعذر حفظ البيانات. يرجى المحاولة مرة أخرى.";

            message.classList.add("error");

            continueButton.disabled = false;
            continueButton.textContent = "التالي: عرض الاختبارات ←";
        }
    });
});

