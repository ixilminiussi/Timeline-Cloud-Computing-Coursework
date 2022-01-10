var user = new Vue({
    el: '#account',
    data: {
        me: { status: 0, username: '', displayname: '', password: ''}, // 0 - Not logged in; 1 - Logged in
        form: { show: 0, passwordInput: 'password', error: ''}, // 0 - nothing; 1 - show login form; 2 - show register form;
        change: {oldPasswordInput: 'password', newPasswordInput: 'password' },
        accountChanges: {tempDisplayname: '', oldPassword: '', newPassword: ''}
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
        this.getUserInfoCookies();
    },
    methods: {
        login: function(username, password) {
            socket.emit("player_login", username, password)
        },
        signup: function(username, password) {
            socket.emit("player_signup", username, password)
        },
        signout: function() {
            this.me.username = ''
            this.me.password = ''
            this.me.displayname = ''
            this.me.status = 0
            this.deleteAllCookies()
            console.log("Cookies after delete: " + document.cookie)
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
        //Remember to reference in the report
        getCookies: function(str){
            let cookieString = RegExp(str+"=[^;]+").exec(document.cookie);
            return decodeURIComponent(!!cookieString ? cookieString.toString().replace(/^[^=]+./,"") : "");
        },
        getUserInfoCookies: function(){
            console.log("Cookie returned: " + document.cookie)
            if(document.cookie.indexOf("username") !== -1){
                this.me.username = this.getCookies("username")
                this.me.displayname = this.getCookies("screenName")
                this.accountChanges.tempDisplayname = this.getCookies("screenName")
                this.me.status = 1
            }
        },
        //Remember to reference in the report
        deleteAllCookies: function(){
            let cookies = document.cookie.split(";");

            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i];
                let eqPos = cookie.indexOf("=");
                let name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
            }
        },
        displayError: function(error) {
            console.log("Error returned: " + error)
            this.form.error = error
            new Promise(resolve => setTimeout(resolve, 5000))
              .then(() => this.form.error = '')
        },
        submitChanges: function (){
            if(this.accountChanges.newPassword === ''){
                this.me.displayname = this.accountChanges.tempDisplayname
                document.cookie = "screenName=" + this.accountChanges.tempDisplayname
                socket.emit("account_update", {
                    username: this.me.username,
                    screenName: this.me.displayname,
                    oldPassword: '',
                    newPassword: ''
                });
            }


        }
    }
});