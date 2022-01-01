var user = new Vue({
    el: '#account',
    data: {
        me: { status: -1, username: '', password: '', email: '' }, // -1 - disconnected; 1 - connected
        form: { show: -1, passwordInput: 'password' }, // -1 - nothing; 0 - show login form; 1 - show register form; 2 - show account applet (profile, disconnect)
    },
    mounted: function() {
        connect();

        // Allows for closing the login form with keypress
        window.addEventListener('keydown', (e) => {
            if (e.key == 'Escape') {
                this.closeLoginForm();
            }
        });

        // Allows for closing the login form by clicking outside
        window.addEventListener('mousedown', (e) => {
            if (this.form.show != -1 && !document.getElementById('loginForm').contains(e.target)) {
                this.closeLoginForm();
            }
        });
    },
    methods: {
        login: function(username, password) {

        },
        signup: function(username, password, email) {

        },
        signout: function() {
            this.me.username = '';
            this.me.password = '';
            this.me.email = '';
            this.me.status = -1;
        },
        createDeck: function() {

        },
        importDecks: function() {

        },
        toggleAccountForm: function() {
            if (this.me.status == -1) {
                this.me.status = 2;
            }
            if (this.me.status == 2) {
                this.me.status = -1;
            }
        },
        showLoginForm: function() {
            this.form.show = 0;
        },
        showSignupForm: function() {
            this.form.show = 1;
        },
        closeLoginForm: function() {
            this.form.show = -1;
        },
        openAccount: function() {
            if (this.me.status == -1) {
                this.status = 0;
            }
        },
        closeAccount: function() {
            this.me.status = -1;
        },
        togglePassword: function() {
            if (this.form.passwordInput == 'password') {
                this.form.passwordInput = 'text';
            } else {
                this.form.passwordInput = 'password';
            }
        }
    }
});