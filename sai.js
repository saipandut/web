 const express = require('express');
const admin = require('firebase-admin');
const app = express();
const bodyParser =require("body-parser");
const bcrypt = require('bcrypt');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
const port = process.env.PORT || 3000; 
app.use(express.static("views"));
const nodemailer = require("nodemailer");
const otpGenerator = require('otp-generator');

const transporter = nodemailer.createTransport({
    service: "Gmail", // e.g., "Gmail"
    auth: {
        user: "saipandu0123@gmail.com",
        pass: "lwfh lepp vfjt ypyq",
    },
});
// Firebase configuration
const serviceAccount = require("./Key.json");
app.set('view engine', 'ejs'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

app.get("/signup",function(req,res){
    res.sendFile(__dirname+"/views/"+"signup.html");
});


/* app.post("/signupSubmit",function(req,res){
    console.log(req.body.name);
   
    db.collection("EntriesList").add({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        mobileNo:req.body.mobileNo,
       dob:req.body.dob,
    }).then(()=>{
        res.redirect(`/dashboard?user=${req.query.name}`);
    });
});
*/

app.post("/signupSubmit", async function (req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const plainPassword = req.body.password; // Get the plain text password from the request body

    // Hash the password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    const mobileNo = req.body.mobileNo;
    const dob = req.body.dob;

    // Check if the email already exists in the database
    const emailExists = await checkIfEmailExists(email);

    if (emailExists) {
        // Handle the case where the email is already registered
        res.send("Email already registered. Please use a different email.");
    } else {
        // Store the hashed password in Firestore
        db.collection("EntriesList")
            .add({
                name: name,
                email: email,
                password: hashedPassword, // Store the hashed password
                mobileNo: mobileNo,
                dob: dob,
            })
            .then(() => {
                res.redirect(`/login`);
            })
            .catch((error) => {
                console.error("Error adding document to Firestore:", error);
                res.send("An error occurred. Please try again.");
            });
    }
});

// Function to check if the email already exists in the database
async function checkIfEmailExists(email) {
    const query = db.collection("EntriesList").where("email", "==", email).limit(1);
    const snapshot = await query.get();
    return !snapshot.empty;
}


/*
app.post("/signinSubmit",function(req,res){
   
    db.collection("EntriesList")
    .where("email", "==", req.body.email)
    .where("password", "==", req.body.password)
    .where("dob", "==", req.body.dob)
    .get()
    .then((docs)=>{
        if(docs.size>0){
            res.redirect(`/dashboard?`);
        }
        else{
            res.send("FAILED TO SIGIN PLEASE TRY AGAIN")
        }
    })
    .catch(error => {
        console.error("Error querying Firestore:", error);
        res.send("An error occurred. Please try again.");
    });
});
*/
app.post("/signinSubmit", async function (req, res) {
    const email = req.body.email;
    const plainPassword = req.body.password;
    const dob = req.body.dob;

    try {
        // Find the user with the given email address
        const userQuery = await db.collection("EntriesList").where("email", "==", email).limit(1).get();

        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();
            const hashedPassword = userData.password;

            // Compare the hashed password with the provided plain password using bcrypt
            const passwordMatch = await bcrypt.compare(plainPassword, hashedPassword);

            if (passwordMatch && userData.dob === dob) {
                // Passwords match, and date of birth is correct
                res.redirect(`/dashboard`);
            } else {
                // Incorrect password or date of birth
                res.send("Failed to sign in. Please check your email, password, and date of birth.");
            }
        } else {
            // User with the provided email address not found
            res.send("User not found. Please check your email address.");
        }
    } catch (error) {
        console.error("Error querying Firestore:", error);
        res.send("An error occurred. Please try again.");
    }
});



app.get("/login",function(req,res){
    res.sendFile(__dirname+"/views/"+"login.html");
});

app.get("/dashboard",function(req,res){
    res.sendFile(__dirname+"/views/"+"dashboard.html");
});

app.get("/logout",function(req,res){
    res.sendFile(__dirname+"/views/"+"logout.html");
}); 

app.get("/home",function(req,res){
    res.sendFile(__dirname+"/views/"+"home.html");
}); 

app.get("/about",function(req,res){
    res.sendFile(__dirname+"/views/"+"about.html");
}); 

app.get("/contact",function(req,res){
    res.sendFile(__dirname+"/views/"+"contact.html");
}); 

app.get("/bookupload",function(req,res){
    res.sendFile(__dirname+"/views/"+"bookupload.html");
}); 

app.get("/booksearch",function(req,res){
    res.sendFile(__dirname+"/views/"+"booksearch.html");
}); 

app.get("/back", function(req, res) {
    res.redirect("/dashboard"); // Redirect to the dashboard route
});


app.get("/forgot-password", (req, res) => {
    res.sendFile(__dirname + "/views/" + "forgot-password.html");
  });
  const crypto = require("crypto");

  app.post('/forgot-password-submit', async function (req, res) {
    const email = req.body.email;

    try {
        // Check if the email is defined
        if (typeof email !== 'undefined') {
            
            // Find the user with the given email address
            const userQuery = await db.collection('EntriesList').where('resetToken', '==', token).limit(1).get();

            if (!userQuery.empty) {
                const userDoc = userQuery.docs[0];

                // Generate a unique token for password reset
                const resetToken = crypto.randomBytes(20).toString('hex');

                // Set an expiration time for the reset token (e.g., 1 hour)
                const resetTokenExpiration = Date.now() + 3600000; // 1 hour in milliseconds

                // Save the reset token and its expiration time to the user document in Firestore
                await userDoc.ref.update({
                    resetToken,
                    resetTokenExpiration,
                });

                // Send the password reset email with a link containing the reset token
                const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
                const emailOptions = {
                    from: 'saipandu0123@gmail.com',
                    to: email,
                    subject: 'Password Reset Request',
                    text: `To reset your password, click on the following link: ${resetLink}`,
                };

                await transporter.sendMail(emailOptions);

                res.send('Password reset instructions have been sent to your email.');
            } else {
                res.status(404).send('User not found. Please check your email address.');
            }
        } else {
            res.status(400).send('Invalid email address.');
        }
    } catch (error) {
        console.error('Error sending reset email:', error);
        res.status(500).send('An error occurred. Please try again.');
    }
});

  
app.post('/reset-password-submit', async function (req, res) {
    const token = req.body.token;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;

    // Verify that newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
        return res.status(400).send('Passwords do not match.');
    }

    // Check if the reset token is defined
    if (!token) {
        return res.status(400).send('Invalid reset token.');
    }

    try {
        // Find the user with the given reset token
        const userQuery = await db.collection('EntriesList').where('resetToken', '==', token).limit(1).get();

        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];

            // Check if the reset token has not expired
            const resetTokenExpiration = userDoc.data().resetTokenExpiration;
            if (resetTokenExpiration < Date.now()) {
                return res.status(400).send('Reset token has expired.');
            }

            // Hash the new password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update the user's password and remove the reset token
            await userDoc.ref.update({
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiration: null,
            });

            return res.send('Password reset successful. You can now log in with your new password.');
        } else {
            return res.status(404).send('Invalid reset token.');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        return res.status(500).send('An error occurred. Please try again.');
    }
});



app.get('/reset-password', function (req, res) {
    // Render the password reset form here
    res.render('reset-password'); // Assuming you have a corresponding EJS file
});





app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/home`);
});
