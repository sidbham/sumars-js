var db = require('./config/mysql_config');
var connection = db.connection;
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var urlbase = require('urlsafe-base64');
var nodemailer = require("nodemailer");
var moment = require('moment');


module.exports.login = function (username, password, callback) {

    var result = false;

    // Get the hash of the password supplied
    bcrypt.hash(password, 2, function (err, result) {

        if (err)
            throw err;
        else {
            var hashedpassword = result;

            // Check to see if user exists
            var storedpassword = connection.query('SELECT count(*) as count FROM users WHERE username="' + username + '"', function (err, rows) {
                if (err) {
                    throw err;
                } else {    // Throw error if user not found in database
                    var setcount = rows[0].count;
                    if (setcount == 0)
                        callback("user does not exist", null);
                    else if (setcount > 1) {    // Handle the case where there is more than one user with the same ID in the database
                        // TODO
                    }
                    else if (setcount == 1) {   // If we got exactly one user back, compare the stored password hash to the hash of the password supplied
                        storedpassword = rows[0].password;
                        if (storedpassword == hashedpassword) {
                            result = true;
                        }
                    }
                }
                callback(null, result);
            });

        }
    });
};

module.exports.signup = function (req, callback) {

    // Get the params from the POST
    var username = req.body.username;
    var password = req.body.password;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;

    // Hash the password and create the user in the database
    var hashedpassword = "";
    bcrypt.hash(password, 2, function (err, result) {
        if (err)
            throw err;
        else {
            hashedpassword = result;
            // Check to ensure the user doesn't already exist
            checkUser(function (err, result) {
                if (result) {
                    // If new user, save to database
                    saveToDB(function (err, result) {
                        if (result) {

                            emailVerification();

                            // Return to caller
                            callback(null, true);
                        } else
                            throw err;
                    });
                }
                else
                    callback(err, null);
            });
        }
    });

    // Generate email verifiation token
    var emailVerification = function (callback) {
        crypto.randomBytes(24, function (err, buf) {
            var token = urlbase.encode(buf);

            saveToken(token, function (err) {
                if (err)
                    throw err;
                else
                    sendEmail(token);
            });
        });
    };

    var saveToken = function (token, callback)
        // update users set ver_token="asdf" where username="boss@bc.com"
    {
        var now = moment();
        var timestamp = now.format('YYYY-MM-DD HH:mm:ss Z');
        console.log(timestamp);
        connection.query("UPDATE `users` SET `ver_token`=\"" + token + "\", ver_token_validity=\"" + timestamp + "\" WHERE username=\"" +
        username + "\"", function (err) {
            if (err) {
                throw err;
            }
            else {
                callback();
            }
        });
    };

    var sendEmail = function (token, err) {
        var smtpTransport = nodemailer.createTransport("SMTP", {
            service: "Gmail",
            auth: {
                user: "user@gmail.com",
                pass: "password"
            }
        });

        smtpTransport.sendMail({
            from: "name <email@email.com>", // sender address
            to: "User <user@email.com>", // comma separated list of receivers
            subject: "Registration Token ✔", // Subject line
            text: token // plaintext body
        }, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log("Message sent: " + response.message);
            }
        });
    };

    var saveToDB = function (callback) {

        // Insert user information into database
        connection.query("INSERT INTO `users` (`id`, `username`, `password`, `firstname`, `lastname`) VALUES (DEFAULT, " +
        "\"" + username + "\", " + "\"" + hashedpassword +
        "\" ," + "\"" + firstname +
        "\", " + "\"" + lastname +
        "\")", function (err, result) {
            if (err) {
                throw err;
            } else {
                result = true;
                callback(null, result);
            }
        });

    };
    var checkUser = function (callback) {

        var result = false;

        connection.query('SELECT count(*) as count from users WHERE username="' + username + '"', function (err, rows) {
            if (err) {
                throw err;
                callback(err, null);
            } else {    // If we don't get an empty resultset, user already exists. Abort sign up.
                if (rows[0].count > 0) {
                    err = "already exists";
                    callback(err, null);
                }
                else {
                    result = true;
                    callback(null, result);
                }
            }
        });
    };
};

module.exports.verifyToken = function (token, callback) {

    var result = false;


    connection.query('SELECT username FROM users WHERE ver_token="' + token + '"', function (err, rows) {
        if (err) {
            throw err;
        } else {    // Throw error if user not found in database

            if (rows[0] != undefined) {
                var username = rows[0].username;
                console.log(username);
            }
        }

    });
    //callback(null, result);
};

module.exports.resetPassword = function () {
};
