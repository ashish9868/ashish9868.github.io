(function () {
    var BrowserFeatureUtility = function (config = {}) {
        var dummyUrl = "https://example.com"
        var soundUrl = "/sample.mp3"
        var modalInformation = $('#modalInformation')
        var modelConfirmation = $('#modalConfirmation')
        this.config = Object.assign({}, config)
        this.testResults = [];
        this.errors = []
        this.toggleInfoModal = function (show, title, message, callbackOk) {
            var modelTitle = modalInformation.find('.modal-title')
            var modelDescription = modalInformation.find('.modal-body p')
            var okButton = modalInformation.find('button.okButton')
            if (show) {
                modelTitle.html(title)
                modelDescription.html(message)
                okButton.on('click', function () {
                    callbackOk()
                })
                modalInformation.modal('show')
            } else {
                modelTitle.html('')
                modelDescription.html('')
                modalInformation.modal('hide')
            }
        };
        this.toggleConfirmationModal = function (show, title, message, callback) {
            var modelTitle = modelConfirmation.find('.modal-title')
            var modelDescription = modelConfirmation.find('.modal-body p')
            var okButton = modelConfirmation.find('button.okButton')
            var cancelButton = modelConfirmation.find('button.cancelButton')
            if (show) {
                modelTitle.html(title)
                modelDescription.html(message)
                okButton.on('click', function () {
                    callback(true)
                })
                cancelButton.on('click', function () {
                    callback(false)
                })
                modelConfirmation.modal('show')
            } else {
                modelTitle.html('')
                modelDescription.html('')
                modelConfirmation.modal('hide')
            }
        }
        this.peformTest = function (data) {
            var index = data.index
            var test = data.test
            var self = this;
            if (!test || typeof test !== "object") {
                return false;
            }
            switch (test.type) {
                case 'VALIDATE_URL':
                    if (test.url && test.name) {
                        self.validateUrl(test.url, function (xhr) {
                            self.testResults[index] = Object.assign(test, {
                                result: xhr.status + "".indexOf("20") != -1,
                                message: "URL StatusCode: " + xhr.status
                            })
                        })
                    } else {
                        self.errors.push("Test: " + test.name + "do not have url or name key.");
                    }
                    break;
                case 'SYSTEMINFO':
                    var info = self.getSystemInfo()
                    self.testResults[index] = Object.assign(test, {
                        result: true,
                        message: info.systemInfoString,
                        extra: info,
                    })
                    break;
                case 'SPEAKER':
                    self.toggleInfoModal(true, "Testing speakers", "You will hear a sound, once contined, please confirm when asked.", function () {
                        self.toggleInfoModal(false)
                        self.playSound(2000, function () {
                            self.toggleConfirmationModal(true, "Heard a sound?", "Please confirm if you've heard a sound?", function (status) {
                                self.testResults[index] = Object.assign(test, {
                                    result: status,
                                    message: "Speakers are " + (status ? "Working" : "Not Working."),
                                })
                                self.toggleConfirmationModal(false)
                            })
                        })
                    })
                    break;
                case 'MICROPHONE':
                    self.toggleInfoModal(true, "Testing microphone access", "You will see a permission popup in your browser's left corner, please allow that to continue.", function () {
                        self.toggleInfoModal(false)
                        self.checkMicroPhoneAccess(function (status) {
                            self.testResults[index] = Object.assign(test, {
                                result: status,
                                message: "Microphone status: " + (status ? "have access to microphone" : "Either access is denied or system don't have microphone."),
                            })
                        })
                    })
                    break;
                case 'CAMERA':
                    self.toggleInfoModal(true, "Testing camera access", "You will see a permission popup in your browser's left corner, please allow that to continue.", function () {
                        self.toggleInfoModal(false)
                        self.checkMicroPhoneAccess(function (status) {
                            self.testResults[index] = Object.assign(test, {
                                result: status,
                                message: "Camera status: " + (status ? "have access to camera" : "Either access is denied or system don't have camera."),
                            })
                        })
                    })
                    break;
                case 'POPUP':
                    var status = self.canOpenPopup()
                    self.testResults[index] = Object.assign(test, {
                        result: status,
                        message: "Popup(s) are " + (status ? "Allowed" : "Not Allowed."),
                    })

                    break;
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
        this.validateCookies = function () {
            return navigator.cookieEnabled
        };
        this.getSystemInfo = function () {
            return {
                os: platform.os,
                systemInfoString: ["Browser: " + platform.name + " | ", platform.os.family, "(" + platform.os.architecture + " bit)", platform.os.version || ''].join(" ").trim(),
                name: platform.name,
                version: platform.version
            }
        };
        this.canOpenPopup = function () {
            const newWin = window.open(dummyUrl, "_blank", "toolbar=no,scrollbars=no,resizable=no,top=0,left=0,width=10,height=10");
            const opened = !(!newWin || newWin.closed || typeof newWin.closed == "undefined")
            setTimeout(function () {
                if (opened) {
                    newWin.close()
                }
            }, 100)
            return opened
        };
        this.playSound = function (timeMs, callback) {
            var audio = document.getElementById('audioPlayer') ?? document.createElement('audio')
            audio.id = "audioPlayer"
            document.body.appendChild(audio)
            audio.src = soundUrl
            audio.autoplay = true;
            setTimeout(function () {
                document.body.removeChild(audio)
                callback()
            }, timeMs);
        };
        this.checkMicroPhoneAccess = function (callback) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function (stream) {
                    const tracks = stream.getTracks();
                    tracks.forEach(function (track) {
                        track.stop()
                    })
                    callback(true)
                })
                .catch(function (err) {
                    callback(false, err)
                });
        };
        this.checkCameraAccess = function (callback) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function (stream) {
                    const tracks = stream.getTracks();
                    tracks.forEach(function (track) {
                        track.stop()
                    })
                    callback(true)
                })
                .catch(function (err) {
                    callback(false, err)
                });
        };
        this.begin = function () {
            var self = this;
            this.config.tests.forEach(function (test, index) {
                self.peformTest({
                    index: index,
                    test: test
                })
            })
        }
    }

    window.BrowserFeatureUtility = BrowserFeatureUtility;
})();