(function () {
    var BrowserFeatureUtility = function (config = {}) {
        var dummyUrl = "https://example.com"
        var soundUrl = "/sample.mp3"
        var modalInformation = $('#modalInformation')
        var modelConfirmation = $('#modalConfirmation')
        this.config = Object.assign({ tests: [] }, config)
        this.testResults = [];
        this.errors = []
        this.toggleInfoModal = function (show, title, message, callbackOk) {
            var modelTitle = modalInformation.find('.modal-title')
            var modelDescription = modalInformation.find('.modal-body p')
            var okButton = modalInformation.find('button.okButton')
            if (show) {
                modelTitle.html(title)
                modelDescription.html(message)
                okButton.unbind('click').on('click', function () {
                    callbackOk()
                })
                modalInformation.modal({
                    keyboard: false,
                    show: true,
                    backdrop: 'static'
                })
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
                okButton.unbind('click').on('click', function () {
                    callback(true)
                })
                cancelButton.unbind('click').on('click', function () {
                    callback(false)
                })
                modelConfirmation.modal({
                    keyboard: false,
                    show: true,
                    backdrop: 'static'
                })
            } else {
                modelTitle.html('')
                modelDescription.html('')
                modelConfirmation.modal('hide')
            }
        };
        this.addTestReport = function (report, index, callback) {
            var testReportContainer = $('#reporting')
            var template = testReportContainer.find('li.d-none')
            var reportItem = template.clone()
            reportItem.removeClass('d-none')
            reportItem.addClass('list-group-item-' + (report.result ? 'success' : 'danger'))
            reportItem.find('.title').html(report.name)
            reportItem.find('.description').html(report.description)
            reportItem.find('.result').html("<strong>STATUS:</strong> " + report.result + ", <strong>DETAILS:</strong> " + report.message)
            testReportContainer.append(reportItem)
            this.testResults[index] = report
            callback()
        };
        this.peformTest = function (data, testCompleteCallBack) {
            var index = data.index
            var test = data.test
            var self = this;
            if (!test || typeof test !== "object") {
                testCompleteCallBack()
                return false;
            }
            switch (test.type) {
                case 'VALIDATE_URL':
                    if (test.urls && test.name) {
                        Promise.all(test.urls.map(function (urlInfo) {
                            return self.validateUrl(urlInfo.url)
                        })).then(function (statuses) {
                            var urls = test.urls
                            var messages = []
                            statuses.forEach(function (val, index) {
                                urls[index].status = val
                                messages[index] = "URL: <a href='" + urls[index].url + "'>" + urls[index].label + "</a> " + "(" + urls[index].url + ")" + " | StatusCode: " + val
                            })
                            self.addTestReport(Object.assign(test, {
                                result: "[" + statuses.join(",") + "]",
                                message: "<br />" + messages.join("<br />"),
                                urls: urls
                            }), index, testCompleteCallBack)
                        })
                    } else {
                        self.errors.push("Test: " + test.name + "do not have url or name key.");
                        testCompleteCallBack()
                    }
                    break;
                case 'SYSTEMINFO':
                    var info = self.getSystemInfo()
                    self.addTestReport(Object.assign(test, {
                        result: true,
                        message: info.systemInfoString,
                        extra: info,
                    }), index, testCompleteCallBack)
                    break;
                case 'COOKIE':
                    console.log(window.cookies)
                    var status = self.areCookiesEnabled(false)
                    self.addTestReport(Object.assign(test, {
                        result: status,
                        message: "Browser cookies are " + (status ? 'enabled' : 'disabled'),
                        extra: info,
                    }), index, testCompleteCallBack)
                    break;
                case 'COOKIE':
                    var status = self.areCookiesEnabled()
                    self.addTestReport(Object.assign(test, {
                        result: status,
                        message: "Browser cookies are " + (status ? 'enabled' : 'disabled'),
                        extra: info,
                    }), index, testCompleteCallBack)
                    break;
                case 'SPEAKER':
                    self.toggleInfoModal(true, "Testing speakers", "You will hear a sound, once contined, please confirm when asked.", function () {
                        self.toggleInfoModal(false)
                        self.toggleConfirmationModal(false)
                        self.playSound(2000, function () {
                            self.toggleConfirmationModal(true, "Heard a sound?", "Please confirm if you've heard a sound?", function (status) {
                                self.toggleConfirmationModal(false)
                                self.addTestReport(Object.assign(test, {
                                    result: status,
                                    message: "Speakers are " + (status ? "working" : "not working."),
                                }), index, testCompleteCallBack)
                            })
                        })
                    })
                    break;
                case 'CAMERA':
                    self.toggleInfoModal(true, "Testing camera access", "You will see a permission popup in your browser's left corner, please allow that to continue.", function () {
                        self.toggleInfoModal(false)
                        self.toggleConfirmationModal(false)
                        self.checkCameraAccess(function (status, err) {
                            console.log(status, err)
                            self.addTestReport(Object.assign(test, {
                                result: status,
                                message: "Camera status: " + (status ? "have access to camera" : "Either access is denied or system don't have camera."),
                            }), index, testCompleteCallBack)
                        })
                    })
                    break;
                case 'MICROPHONE':
                    self.toggleInfoModal(true, "Testing microphone access", "You will see a permission popup in your browser's left corner, please allow that to continue.", function () {
                        self.toggleInfoModal(false)
                        self.toggleConfirmationModal(false)
                        self.checkMicroPhoneAccess(function (status) {
                            self.addTestReport(Object.assign(test, {
                                result: status,
                                message: "Microphone status: " + (status ? "have access to microphone" : "Either access is denied or system don't have microphone."),
                            }), index, testCompleteCallBack)
                        })
                    })
                    break;
                case 'POPUP':
                    var status = self.canOpenPopup()
                    self.addTestReport(Object.assign(test, {
                        result: status,
                        message: "Popup(s) are " + (status ? "allowed" : "not allowed."),
                    }), index, testCompleteCallBack)

                    break;
                default:
                    testCompleteCallBack()
            }
        };
        this.validateUrl = function (url) {
            return new Promise(function (resolve) {
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
                    complete: function (xhr) {
                        resolve(xhr.status)
                    },
                })
            })
        };
        this.areCookiesEnabled = function () {
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
            var audio = new Audio(soundUrl)
            audio.play()
            setTimeout(function () {
                audio.pause()
                audio.currentTime = 0
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
                    setTimeout(function () {
                        callback(true)
                    }, 500);
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
                    setTimeout(function () {
                        callback(true)
                    }, 500);
                })
                .catch(function (err) {
                    callback(false, err)
                });
        };
        this.begin = function () {
            var self = this;
            self.index = 0
            var executeTest = function () {
                self.peformTest({
                    index: self.index,
                    test: self.config.tests[self.index],
                }, function () {
                    self.index++;
                    if (self.index > self.config.tests.length - 1) {
                        self.index = 0
                        self.downloadReport(function () {
                            alert("All tests were performed, successfully, output json generated succesfully.")
                        })
                    } else {
                        executeTest()
                    }
                })
            }
            executeTest(self.index)
        };
        this.downloadReport = function (callback) {
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.testResults));
            var dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", "browserTestReport.json");
            document.body.appendChild(dlAnchorElem)
            dlAnchorElem.click();
            setTimeout(function () {
                document.body.removeChild(dlAnchorElem)
                callback()
            }, 500)

        }
    }

    window.BrowserFeatureUtility = BrowserFeatureUtility;
})();