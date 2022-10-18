(function () {
    var BrowserFeatureUtility = function (config = {}) {
        this.config = Object.assign({}, config)
        this.errors = []
        this.isTestValid = function (test) {
            var self = this;
            if (!test || typeof test !== "object") {
                return false;
            }
            switch (test.type) {
                case 'VALIDATE_URL':
                    if (test.url && test.name) {
                        return true;
                    } else {
                        self.errors.push("Test: " + test.name + "do not have url or name key.");
                        return false;
                    }
                default:
                    return false;
            }
        };
        this.validateUrl = function (url, callback) {
            $.ajax({
                cache: false,
                dataType: "jsonp",
                async: true,
                crossDomain: true,
                url: url,
                method: "GET",
                headers: {
                    accept: "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                complete: callback,
            })
        };
        this.validateCamera = function () {

        };
        this.validateCookies = function () {
            return navigator.cookieEnabled
        };
        this.browserInfo = function () {
            return {
                os: platform.os,
                osString: [platform.os.family, "(" + platform.os.architecture + " bit)", platform.os.version || ''].join(" ").trim(),
                name: platform.name,
                version: platform.version
            }
        };
        this.canOpenPopup = function () {
            const newWin = window.open("https://google.com", "_blank", "toolbar=no,scrollbars=no,resizable=no,top=0,left=0,width=10,height=10");
            const opened = !(!newWin || newWin.closed || typeof newWin.closed == "undefined")
            setTimeout(function () {
                if (opened) {
                    newWin.close()
                }
            }, 100)
            return opened
        };
        this.parseTests = function () {
            var self = this;
            this.config.tests.forEach(function (test) {
                self.isTestValid(test)
            })
        };

        this.begin = function () {
            console.log(this.browserInfo(), this.canOpenPopup())
            this.parseTests()
            this.validateCamera()
        }
    }

    window.BrowserFeatureUtility = BrowserFeatureUtility;
})();