var user = new Vue({
    el: '#account',
    data: {
        me: { status: 0, username: '', displayname: '', password: '', email: '' }, // 0 - Not logged in; 1 - Logged in
        form: { show: 0, passwordInput: 'password' }, // 0 - nothing; 1 - show login form; 2 - show register form;
        change: { newdisplayname: '', newemail: '', oldPassword: '', newPassword: '', oldPasswordInput: 'password', newPasswordInput: 'password' }
    },
    mounted: function() {
        // Allows for closing the login form with keypress
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeLoginForm();
            }
        });

        // Allows for closing the login form by clicking outside
        window.addEventListener('mousedown', (e) => {
            if (this.form.show !== 0 && !document.getElementById('loginForm').contains(e.target)) {
                this.closeLoginForm();
            }
        });

        //Check cookie for log in session data
        this.getUserInfoCookie();
    },
    methods: {
        login: function(username, password) {
            socket.emit("player_login", username, password)
        },
        signup: function(username, password, email) {
            socket.emit("player_signup", username, password, email)
        },
        signout: function() {
            this.me.username = '';
            this.me.password = '';
            this.me.email = '';
            this.me.status = 0;
        },
        createDeck: function() {

        },
        importDecks: function() {

        },
        toggleAccountForm: function() {
            //Old status codes
            // if (this.me.status === -1) {
            //     this.me.status = 2;
            // }
            // if (this.me.status === 2) {
            //     this.me.status = -1;
            // }
        },
        showLoginForm: function() {
            this.form.show = 1;
        },
        showSignupForm: function() {
            this.form.show = 2;
        },
        closeLoginForm: function() {
            this.form.show = 0;
        },
        openAccount: function() {
            //Old status codes
            // if (this.me.status === -1) {
            //     this.status = 0;
            // }
        },
        closeAccount: function() {
            //Old status codes
            // this.me.status = -1;
        },
        togglePassword: function(input) {
            if (input === 'passwordInput') {
                if (this.form.passwordInput === 'password') {
                    this.form.passwordInput = 'text';
                } else {
                    this.form.passwordInput = 'password';
                }
            }
            if (input === 'newPasswordInput') {
                if (this.change.newPasswordInput === 'password') {
                    this.change.newPasswordInput = 'text';
                } else {
                    this.change.newPasswordInput = 'password';
                }
            }
            if (input === 'oldPasswordInput') {
                if (this.change.oldPasswordInput === 'password') {
                    this.change.oldPasswordInput = 'text';
                } else {
                    this.change.oldPasswordInput = 'password';
                }
            }
        },
        getCookie: function(str){
            // Get name followed by anything except a semicolon
            let cookieString = RegExp(str+"=[^;]+").exec(document.cookie);
            // Return everything after the equal sign, or an empty string if the cookie name not found
            return decodeURIComponent(!!cookieString ? cookieString.toString().replace(/^[^=]+./,"") : "");
        },
        getUserInfoCookie: function(){
            console.log("Cookie returned: " + document.cookie)
            if(document.cookie.indexOf("username") !== -1){
                this.me.username = this.getCookie("username")
                this.me.displayname = this.getCookie("screenName")
                this.me.status = 1
            }
        }
    }
});