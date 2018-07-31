var Promise = require('bluebird');
var db = require('../helpers/sql')();
var storage = require('../helpers/storage');
var Chance = require('chance');
var chance = new Chance();
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var mailOptions = {
    auth: {
        api_key: process.env.CONFIG_SENDGRID_API_KEY
    }
};
var smtpConfig = {
    host: process.env.CONFIG_SMTP_PROXY,
    port: process.env.CONFIG_SMTP_PROXY_PORT
};
//determine which mailer to use. If SMTP proxy options are set, use the proxy. Otherwise use sendgrid

//var mailer = "";
if (process.env.CONFIG_SMTP_PROXY !== undefined && process.env.CONFIG_SMTP_PROXY !== "") {
    var mailer = nodemailer.createTransport(smtpConfig);
} else {
    var mailer = nodemailer.createTransport(sgTransport(mailOptions));
}

//var mailer = nodemailer.createTransport(smtpConfig); //SMTP options
//var mailer = nodemailer.createTransport(sgTransport(mailOptions)); //Sendgrid Options
var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');
var jsonpack = require('jsonpack/main');
var request = require('request');

module.exports = function(server) {
    server.get('/api/report/p', function(req, res) {
        if (!req.query.type) {
            req.query.type = 'json';
        }

        delete req.headers['accept-encoding'];
        delete req.headers.connection;
        request({
            uri: 'http://' + req.headers.host + '/api/report',
            method: 'POST',
            headers: req.headers,
            json: jsonpack.unpack(req.query.p)
        }, function(error, response, body) {
            generateReport(req, res, body);
        });
    });

    server.get('/api/report/:reportId', function(req, res) {
        if (!req.query.type) {
            req.query.type = 'json';
        }

        var shareURLPrefix = '';
        if (process.env.CONFIG_DOMAIN_NAME === '') {
            shareURLPrefix = 'http://' + req.headers.host;
        }else{
            shareURLPrefix = process.env.CONFIG_DOMAIN_NAME;
        }
        if (storage[req.params.reportId]) {
            generateReport(req, res, {
                reportId: req.params.reportId,
                shareURL: shareURLPrefix + '/report/' + req.params.reportId,
                report: storage[req.params.reportId]
            });
        } else {
            db.ReportHash.findOne({
                where: {hash: req.params.reportId}
            }).then(function(record) {
                if (record === null) {
                    res.status(404).send({
                        error: 'Invalid report id'
                    });
                } else {
                    if (!req.query.type) {
                        req.query.type = 'json';
                    }

                    delete req.headers['accept-encoding'];
                    delete req.headers.connection;
                    request({
                        uri: 'http://' + req.headers.host + '/api/report',
                        method: 'POST',
                        headers: req.headers,
                        json: JSON.parse(record.report_parameters)
                    }, function(error, response, body) {
                        generateReport(req, res, body);
                    });
                }

            });

        }
    });

    function generateReport(req, res, data) {
        if (req.query.type === 'json') {
            return res.send(data);
        } else if (req.query.type === 'email') {
            var email = {
                to: [req.query.email || req.session.loginData.userEmail],
                from: process.env.CONFIG_SENDGRID_FROM_EMAIL,
                subject: 'Crossroads Attendance Report: ' + data.report.requestParameters.startDate + ' - ' + data.report.requestParameters.endDate,
                text: 'HTML Email Not Supported - View Report At: ' + data.shareURL,
                html: ''
            };
            var templateDir = path.join(__dirname, '../helpers/email_templates', 'reports');
            return new EmailTemplate(templateDir).render(data, function (err, result) {
                if (err) {
                    console.log(err)
                }
                email.html = result.html;

                db.ReportHash.create({
                    hash: data.reportId,
                    created_date: new Date(),
                    report_parameters: JSON.stringify(data.report.requestParameters),
                    created_user_id: req.session.loginData.dbUserId
                });
                mailer.sendMail(email, function(err, resp) {

                    if (err) {
                        console.log('/////////////////');
                        console.log('/////////////////');
                        console.log('/////////////////');
                        console.log(err);
                        console.log('/////////////////');
                        console.log('/////////////////');
                        console.log('/////////////////');
                        console.log(result);
                        console.log('/////////////////');
                        console.log('/////////////////');
                        console.log('/////////////////');

                        return res.send({
                            success: false,
                            sentTo: req.query.email || req.session.loginData.userEmail,
                            emailData: result
                        });
                    }

                    res.send({
                        success: true,
                        sentTo: req.query.email || req.session.loginData.userEmail,
                        emailData: result
                    });
                });
            });
        } else if (req.query.type === 'csv') {
            var csv = require('fast-csv');
            res.setHeader('Content-Disposition', 'attachment;filename=' + data.report.requestParameters.startDate + ' CR Attendance' + '.csv');
            res.setHeader('content-type', 'application/csv');
            var csvData = [
                ['Location']
            ];

            data.report.data.meta.comparisons.forEach(function(comparison) {
                csvData[0].push(comparison.replace(/<br>/g, ' '));
            });
            data.report.data.meta.entry_types.forEach(function(entry_type) {
                csvData[0].push(entry_type);
            });
            // csvData[0].push('Notes');

            for (var i in data.report.data) {
                if (i !== 'meta') {
                    var entry = [];
                    entry.push(i);
                    data.report.data.meta.comparisons.forEach(function(comparison) {
                        entry.push(data.report.data[i].comparisons[comparison] || 'N/A');
                    });
                    data.report.data.meta.entry_types.forEach(function(entry_type) {
                        entry.push(data.report.data[i][entry_type] || '0');
                    });
                    // entry.push(data.report.data[i].notes.join(', '));
                    csvData.push(entry);

                    for (var m in data.report.data[i].ministries) {
                        entry = [];
                        entry.push(m);

                        data.report.data.meta.comparisons.forEach(function(comparison) {
                            entry.push(data.report.data[i].ministries[m].comparisons[comparison] || 'N/A');
                        });

                        data.report.data.meta.entry_types.forEach(function(entry_type) {
                            entry.push(data.report.data[i].ministries[m][entry_type] || '0');
                        });

                        csvData.push(entry);
                    }
                    csvData.push([]);
                }
            }

            csv.writeToStream(res, csvData, {headers: true});
        } else {
            res.status(500).send({});
        }
    }

};
