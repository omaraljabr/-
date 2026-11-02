

document.addEventListener("DOMContentLoaded", function () {
console.log("ExamPro is ready!");

const loginForm = document.getElementById("login-form");

// إذا لم تكن هذه صفحة تسجيل الدخول، فلا ننفذ كود الدخول.
if (!loginForm) {
    return;
}

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginMessage = document.getElementById("login-message");

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Abdullah@2026";

loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        sessionStorage.setItem("adminLoggedIn", "true");

        window.location.href = "admin.html";
        return;
    }

    if (loginMessage) {
        loginMessage.textContent =
            "اسم المستخدم أو كلمة المرور غير صحيحة.";
    } else {
        alert("اسم المستخدم أو كلمة المرور غير صحيحة.");
    }
});

});
