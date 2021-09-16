const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = async(email, name)=>{
    try{
        await sgMail.send({
            to: email,
            from: 'jesus.i.guzman.a@gmail.com',
            subject: 'Welcome to the app!',
            text: `Welcome to the app ${name}. Let me know your experience on the app`
        });
    }catch(e){
        throw new Error(e.message)
    }
}

const sendCancelationMail = async(email,name)=>{
    try{
        await sgMail.send({
            to: email,
            from: 'jesus.i.guzman.a@gmail.com',
            subject: 'Sad you\'re leaving, we wish you the best!',
            text: `Thanks for using our application ${name} we hoped you had a great time in here and wish you the best!`
        })
    }catch(e){
        throw new Error(e.message);
    }
};

module.exports = {
    sendWelcomeEmail,
    sendCancelationMail
};