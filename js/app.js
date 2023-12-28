/* Template Name: Qexal - Responsive Bootstrap 4 Landing Page Template
   Author: Themesbrand
   Version: 1.0.0
   Created: Jan 2019
   File Description: Main js file
*/

//  Window scroll sticky class add

function windowScroll() {
    const navbar = document.getElementById("navbar");
    if (
        document.body.scrollTop >= 50 ||
        document.documentElement.scrollTop >= 50
    ) {
        navbar.classList.add("nav-sticky");
    } else {
        navbar.classList.remove("nav-sticky");
    }
}

window.addEventListener("scroll", (ev) => {
    ev.preventDefault();
    windowScroll();
});

// Smooth scroll
var scroll = new SmoothScroll("#navbar-navlist a", {
    speed: 500,
});

// Contact Form
function validateForm() {
    var name = document.forms["myForm"]["name"].value;
    var email = document.forms["myForm"]["email"].value;
    var subject = document.forms["myForm"]["subject"].value;
    var comments = document.forms["myForm"]["comments"].value;

    // Clear previous messages
    clearMessages();

    // Client-side validation
    if (name.trim() === "") {
        displayErrorMessage("Please enter a Name");
        return false;
    }
    if (email.trim() === "") {
        displayErrorMessage("Please enter an Email");
        return false;
    }
    if (subject.trim() === "") {
        displayErrorMessage("Please enter a Subject");
        return false;
    }
    if (comments.trim() === "") {
        displayErrorMessage("Please enter Comments");
        return false;
    }

    // AJAX request
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                // Successful response
                displaySuccessMessage("Message sent successfully");
                // Optionally, you can clear the form fields here
                clearFormFields();
            } else {
                // Error handling for HTTP status other than 200
                displayErrorMessage("Error: " + this.status);
            }
        }
    };

    // Construct the request parameters
    var params =
        "name=" + encodeURIComponent(name) +
        "&email=" + encodeURIComponent(email) +
        "&subject=" + encodeURIComponent(subject) +
        "&comments=" + encodeURIComponent(comments);

    // Send the request
    xhttp.open("POST", "https://projectx-landingpage-production.up.railway.app/send-message", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(params);

    return false;
}

function displayErrorMessage(message) {
    var errorMsgElement = document.getElementById("error-msg");
    errorMsgElement.style.opacity = 1;
    errorMsgElement.innerHTML = "<div class='alert alert-danger error-message'>" + message + "</div>";
}

function displaySuccessMessage(message) {
    var successMsgElement = document.getElementById("simple-msg");
    successMsgElement.innerHTML = "<div class='alert alert-success success-message'>" + message + "</div>";
}

function clearMessages() {
    document.getElementById("error-msg").style.opacity = 0;
    document.getElementById("error-msg").innerHTML = "";
    document.getElementById("simple-msg").innerHTML = "";
}

function clearFormFields() {
    // Clear form fields after successful submission
    document.forms["myForm"]["name"].value = "";
    document.forms["myForm"]["email"].value = "";
    document.forms["myForm"]["subject"].value = "";
    document.forms["myForm"]["comments"].value = "";
}


function fadeIn() {
    var fade = document.getElementById("error-msg");
    var opacity = 0;
    var intervalID = setInterval(function() {
        if (opacity < 1) {
            opacity = opacity + 0.5;
            fade.style.opacity = opacity;
        } else {
            clearInterval(intervalID);
        }
    }, 200);
}

// feather icon

feather.replace();

// Preloader

window.onload = function loader() {
    setTimeout(() => {
        document.getElementById("preloader").style.visibility = "hidden";
        document.getElementById("preloader").style.opacity = "0";
    }, 350);
};

function showPopup(message, isSuccess) {
    var popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.width = "200px";
    popup.style.height = "120px";
    popup.style.backgroundColor = isSuccess ? "#d4edda" : "#f8d7da";
    popup.style.color = isSuccess ? "#155724" : "#721c24";
    popup.style.padding = "20px";
    popup.style.border = "solid 1px";
    popup.style.borderColor = isSuccess ? "#c3e6cb" : "#f5c6cb";
    popup.style.borderRadius = "5px";
    popup.style.zIndex = "1000";
    popup.style.left = "50%";
    popup.style.top = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.textAlign = "center";

    var image = document.createElement("img");
    image.src = isSuccess ? "images/ui/check.png" : "images/ui/remove.png";
    image.style.width = "50px";
    image.style.height = "50px";
    image.style.marginBottom = "10px";
    popup.appendChild(image);

    var text = document.createElement("p");
    text.style.marginTop = "0";
    text.appendChild(document.createTextNode(message));
    popup.appendChild(text);

    document.body.appendChild(popup);

    // Automatically remove the popup after 3 seconds
    setTimeout(function() {
        document.body.removeChild(popup);
    }, 3000);
}

function handleSignUp(event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Retrieve user input
    const username = document.getElementById("username").value;
    const zaloapi = document.getElementById("zaloapi").value;
    const fptapi = document.getElementById("fptapi").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Clear previous messages
    clearMessages();

    // Client-side validation
    if (!username.trim() || !zaloapi.trim() || !fptapi.trim() || !email.trim() || !password.trim()) {
        displayErrorMessage("All fields are required");
        return;
    }

    // Additional validation logic if needed

    // AJAX request
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                // Successful response
                const response = JSON.parse(this.responseText);
                if (response.message) {
                    showPopup(response.message, true);
                    // Optionally, you can clear the form fields here
                    clearFormFields();
                } else {
                    showPopup("Error: Invalid response", false);
                }
            } else {
                // Error handling for HTTP status other than 200
                showPopup("Error: " + this.status, false);
            }
        }
    };

    // Construct the request parameters
    var params =
        "username=" + encodeURIComponent(username) +
        "&zaloapi=" + encodeURIComponent(zaloapi) +
        "&fptapi=" + encodeURIComponent(fptapi) +
        "&email=" + encodeURIComponent(email) +
        "&password=" + encodeURIComponent(password);

    // Send the request
    xhttp.open("POST", "https://projectx-landingpage-production.up.railway.app/sign-up", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(params);
}

const signUpButton = document.getElementById("signup-submit-btn");
signUpButton.addEventListener("click", handleSignUp);




function hideTerms() {
    document.getElementById('termcondition').style.display = 'none';
}


document.querySelector('.close-button').addEventListener('click', hideTerms);

document.getElementById('termcondition').addEventListener('click', function(event) {
    var container = document.querySelector('.popup-container');

    if (!container.contains(event.target)) {
        hideTerms();
    }
});