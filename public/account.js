var user = new Vue({
    el: '#account',
    data: {
        me: { status: 0, username: '', displayname: '', password: ''}, // 0 - Not logged in; 1 - Logged in
        form: { show: 0, passwordInput: 'password', error: '', successMsg: false, deletingDeck: ''}, // 0 - nothing; 1 - show login form; 2 - show register form;
        change: {oldPasswordInput: 'password', newPasswordInput: 'password' },
        accountChanges: {tempDisplayname: '', oldPassword: '', newPassword: ''},
        file: { selectedFile: null }
    },
    mounted: function() {
        // Allows for closing the login form with keypress
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeForm();
            }
        })

        // Allows for closing the login form by clicking outside
        window.addEventListener('mousedown', (e) => {
            if (this.form.show !== 0 && !document.getElementById('form').contains(e.target)) {
                this.closeForm();
            }
        })

        //Check cookie for log in session data
        this.getUserInfoCookies();

        if (this.me.status === 1) {
            socket.emit("available_decks", this.me)
        }
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
            this.accountChanges.tempDisplayname = ''
            this.me.status = 0
            this.deleteAllCookies()
            console.log("Cookies after delete: " + document.cookie)
            socket.emit("available_decks", this.me)
        },
        createDeck: function() {

            read = new FileReader();

            read.readAsBinaryString(this.file.selectedFile);

            var userJson = this.me
            var deckJson
            read.onloadend = function(){
                try {
                    deckJson = JSON.parse(read.result)
                    if (deckJson != null) {
                        socket.emit("create_deck", deckJson, userJson)
                    }
                } catch (e) {
                    if (e instanceof SyntaxError) {
                        alert(e)
                    }
                }
            }
        },
        showDeleteForm: function(deck) {
            this.form.deletingDeck = deck
            this.form.show = 4
        },
        deleteDeck: function() {
            socket.emit("delete_deck", this.form.deletingDeck, this.me)
        },
        showLoginForm: function() {
            this.form.show = 1
        },
        showSignupForm: function() {
            this.form.show = 2
        },
        closeForm: function() {
            this.form.show = 0
        },
        togglePassword: function(input) {
            if (input === 'passwordInput') {
                if (this.form.passwordInput === 'password') {
                    this.form.passwordInput = 'text'
                } else {
                    this.form.passwordInput = 'password'
                }
            }
            if (input === 'newPasswordInput') {
                if (this.change.newPasswordInput === 'password') {
                    this.change.newPasswordInput = 'text'
                } else {
                    this.change.newPasswordInput = 'password'
                }
            }
            if (input === 'oldPasswordInput') {
                if (this.change.oldPasswordInput === 'password') {
                    this.change.oldPasswordInput = 'text'
                } else {
                    this.change.oldPasswordInput = 'password'
                }
            }
        },
        changeFile: function(event) {
            this.file.selectedFile = event.target.files[0]
        },
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
            this.form.successMsg = false
            this.form.error = error
            new Promise(resolve => setTimeout(resolve, 5000))
              .then(() => this.form.error = '')
        },
        submitChanges: function (){
            console.log("Submitting Changes")
            this.me.displayname = this.accountChanges.tempDisplayname
            document.cookie = "screenName=" + this.accountChanges.tempDisplayname
            if(this.accountChanges.newPassword === ''){
                socket.emit("account_update", {
                    username: this.me.username,
                    screenName: this.me.displayname,
                    oldPassword: '',
                    newPassword: ''
                });
            } else {
                socket.emit("account_update", {
                    username: this.me.username,
                    screenName: this.me.displayname,
                    oldPassword: this.accountChanges.oldPassword,
                    newPassword: this.accountChanges.newPassword
                });
            }
        } ,
        displaySuccess: function () {
            console.log("Update Succeeded")
            this.form.successMsg = true
            this.form.error = ''
            new Promise(resolve => setTimeout(resolve, 5000))
              .then(() => this.form.successMsg = false)
        }
    }
})
