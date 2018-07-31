var Promise = require('bluebird');
var db = require('../helpers/sql')();
var storage = require('../helpers/storage');
var Chance = require('chance');
var chance = new Chance();
var jsonpack = require('jsonpack/main');

module.exports = function(server) {
    server.post('/api/report', function(req, res) {
        var reportId = chance.guid();
        var report;
        var gte = new Date(req.body.startDate);
        gte.setHours(0);
        var lte = new Date(req.body.endDate);
        lte.setHours(23);
        storage[reportId] = {
            requestParameters: req.body
        };
        report = storage[reportId];

        db.ServiceInstance.findAll({
            where: {
                date_of_service: {
                    $gte: gte,
                    $lte: lte
                },
                notes: getNotesLike()
            },
            include: determineIncludes()
        }).then(function(services) {
            report.data = {
                meta: {
                    notes: [],
                    sites: [],
                    ministries: [],
                    labels: [],
                    comparisons: [],
                    entry_types: []
                },
                'All Church': {
                    ministries: {},
                    comparisons: {},
                    notes: [],
                    Total: 0,
                    Services: 0,
                    display_order: -1
                }
            };
	        services.forEach(function(service) {
			
                var site;
                var ministry;
                var allChurchMinistry;
				
				
                if (!report.data[service[process.env.TABLE_PREFIX_SITE+'site'].site_name]) {
                    report.data[service[process.env.TABLE_PREFIX_SITE+'site'].site_name] = {
                        ministries: {},
                        comparisons: {},
                        notes: [],
                        Total: 0,
                        Services: 0,
                        display_order: service[process.env.TABLE_PREFIX_SITE+'site'].display_order
                    };
                }
                site = report.data[service[process.env.TABLE_PREFIX_SITE+'site'].site_name];
                if (!report.data[service[process.env.TABLE_PREFIX_SITE+'site'].site_name].ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name]) {
                    report.data[service[process.env.TABLE_PREFIX_SITE+'site'].site_name].ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name] = {
                        notes: [],
                        comparisons: {},
                        Total: 0,
                        Services: 0,
                        display_order: service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].display_order
                    };
                }
                if (!report.data['All Church'].ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name]) {
                    report.data['All Church'].ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name] = {
                        notes: [],
                        comparisons: {},
                        Total: 0,
                        Services: 0
                    };
                }
                ministry = report.data[service[process.env.TABLE_PREFIX_SITE+'site'].site_name].ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name];
                allChurchMinistry = report.data['All Church'].ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name];
                if (!site[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name]) site[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] = 0;
                if (!ministry[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name]) ministry[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] = 0;
                if (!report.data['All Church'][service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name]) report.data['All Church'][service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] = 0;
                if (!allChurchMinistry[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name]) allChurchMinistry[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] = 0;
                site[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] += parseInt(service.entry_value) || 0;
                ministry[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] += parseInt(service.entry_value) || 0;
                site.Total += parseInt(service.entry_value) || 0;
                ministry.Total += parseInt(service.entry_value) || 0;
                site.Services ++;
                ministry.Services ++;
                report.data['All Church'][service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] += parseInt(service.entry_value) || 0;
                allChurchMinistry[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] += parseInt(service.entry_value) || 0;
                report.data['All Church'].Total += parseInt(service.entry_value) || 0;
                allChurchMinistry.Total += parseInt(service.entry_value) || 0;
                report.data['All Church'].Services ++;
                allChurchMinistry.Services ++;
                if (service.notes) {
                    if (site.notes.indexOf(service.notes) === -1) {
                        site.notes.push(service.notes);
                        report.data['All Church'].notes.push(service.notes);
                    }
                    if (ministry.notes.indexOf(service.notes) === -1) {
                        ministry.notes.push(service.notes);
                        allChurchMinistry.notes.push(service.notes);
                    }
                    if (report.data.meta.notes.indexOf(service.notes) === -1) {
                        report.data.meta.notes.push(service.notes);
                    }
                }
                if (report.data.meta.sites.indexOf(service[process.env.TABLE_PREFIX_SITE+'site'].site_name) === -1) {
                    report.data.meta.sites.push(service[process.env.TABLE_PREFIX_SITE+'site'].site_name);
                }
                if (report.data.meta.ministries.indexOf(service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name) === -1) {
                    report.data.meta.ministries.push(service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name);
                }
                if (report.data.meta.labels.indexOf(service[process.env.TABLE_PREFIX_SERVICE+'service'].service_name) === -1) {
                    report.data.meta.labels.push(service[process.env.TABLE_PREFIX_SERVICE+'service'].service_name);
                }
                if (report.data.meta.entry_types.indexOf(service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name) === -1) {
                    report.data.meta.entry_types[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].display_order] = service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name;
                }				
            });
            var promises = [];
            req.body.comparisonDates.forEach(function(data) {
                var reportDays = dateDiffInDays(new Date(req.body.startDate), new Date(req.body.endDate) );
                promises.push(processComparison(data, report.data, reportDays));
            });
            
            report.data.meta.entry_types = report.data.meta.entry_types.filter(function(n){ return n != null });
            Promise.all(promises).then(function() {
                if (report.requestParameters.filter && report.requestParameters.filter.site) {
                    delete report.data['All Church'];
                }
                var shareURL_ = "";
                if (process.env.CONFIG_DOMAIN_NAME === "") {
                    shareURL_ = 'http://' + req.headers.host;
                } else {
                    shareURL_ = process.env.CONFIG_DOMAIN_NAME;
                }
                report.data.meta.entry_types.unshift('Total');
                res.send({
                    reportId: reportId,
                    shareURL: shareURL_ + '/report/' + reportId,
                    report: report
                })
            });
        });

        function processComparison(comparisonData, reportData, reportDays) {
            return new Promise(function (resolve, reject) {
                var comparisonName =
                    (comparisonData.calculationType === 'vs_same' ? 'Change<br>vs same<br>' : 'Change<br>vs average<br>') +
                    comparisonData.label;

                if (reportData.meta.comparisons.indexOf(comparisonName) === -1) {
                    reportData.meta.comparisons.push(comparisonName);
                }
                
                //disregard entry hours
                var tgte = new Date(comparisonData.startDate);
                tgte.setHours(0);
                var tlte = new Date(comparisonData.endDate);
                tlte.setHours(23);
                
                db.ServiceInstance.findAll({
                    where: {
                        date_of_service: {
                            $gte: tgte,
                            $lte: tlte
                        },
                        notes: getNotesLike()
                    },
                    include: determineIncludes()
                }).then(function(services) {
                    var counts = {
                        'All Church': {
                            reportRef: report.data['All Church'],
                            ministries: {},
                            Total: 0,
                            Services: 0
                        }
                    };
                    services.forEach(function(service) {
                        var site;
                        var allChurch = counts['All Church'];
                        var ministry;
                        var allChurchMinistry;

                        //BEGIN handle non-existing comparibles in report data
                        //This section is required to optain the correct totals for comparison percentages   
                        if (!report.data[service[process.env.TABLE_PREFIX_SITE+'site'].site_name]) {
                            report.data[service[process.env.TABLE_PREFIX_SITE+'site'].site_name] = {
                                ministries: {},
                                comparisons: {},
                                notes: [],
                                Total: 0,
                                Services: 0,
                                display_order: service[process.env.TABLE_PREFIX_SITE+'site'].display_order
                            };
                        }
                        if (!report.data[service[process.env.TABLE_PREFIX_SITE+'site'].site_name].ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name]) {
                            report.data[service[process.env.TABLE_PREFIX_SITE+'site'].site_name].ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name] = {
                                notes: [],
                                comparisons: {},
                                Total: 0,
                                Services: 0,
                                display_order: service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].display_order
                            };
                        }
                        if (!report.data['All Church'].ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name]) {
                            report.data['All Church'].ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name] = {
                                notes: [],
                                comparisons: {},
                                Total: 0,
                                Services: 0
                            };
                        }
                        //END handle non-existing comparibles in report data 

                        if (!counts[service[process.env.TABLE_PREFIX_SITE+'site'].site_name]) {
                            counts[service[process.env.TABLE_PREFIX_SITE+'site'].site_name] = {
                                reportRef: report.data[service[process.env.TABLE_PREFIX_SITE+'site'].site_name],
                                ministries: {},
                                Total: 0,
                                Services: 0
                            };
                        }
                        site = counts[service[process.env.TABLE_PREFIX_SITE+'site'].site_name];
                        if (!site.ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name]) {
                            site.ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name] = {
                                reportRef: report.data[service[process.env.TABLE_PREFIX_SITE+'site'].site_name].ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name],
                                Total: 0,
                                Services: 0
                            };
                        }
                        if (!allChurch.ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name]) {
                            allChurch.ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name] = {
                                reportRef: report.data['All Church'].ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name],
                                Total: 0,
                                Services: 0
                            };
                        }
                        ministry = site.ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name];
                        allChurchMinistry = allChurch.ministries[service[process.env.TABLE_PREFIX_MINISTRY+'ministry'].ministry_name];

                        if (!site[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name]) site[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] = 0;
                        if (!ministry[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name]) ministry[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] = 0;
                        if (!allChurch[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name]) allChurch[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] = 0;
                        if (!allChurchMinistry[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name]) allChurchMinistry[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] = 0;

                        site[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] += parseInt(service.entry_value) || 0;
                        allChurch[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] += parseInt(service.entry_value) || 0;
                        ministry[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] += parseInt(service.entry_value) || 0;
                        allChurchMinistry[service[process.env.TABLE_PREFIX_ENTRY_TYPE+'entry_type'].entry_type_name] += parseInt(service.entry_value) || 0;
                        site.Total += parseInt(service.entry_value) || 0;
                        allChurch.Total += parseInt(service.entry_value) || 0;
                        ministry.Total += parseInt(service.entry_value) || 0;
                        allChurchMinistry.Total += parseInt(service.entry_value) || 0;
                        site.Services ++;
                        allChurch.Services ++;
                        ministry.Services ++;
                        allChurchMinistry.Services ++;
                    });
					
                    var comparisonDays = dateDiffInDays(new Date(comparisonData.startDate), new Date(comparisonData.endDate));

                    for (var site_name in counts) {
                        var siteCounts = counts[site_name];
                        var site = counts[site_name].reportRef;
                        if (comparisonData.calculationType === 'vs_same') {
                            site.comparisons[comparisonName] = parseFloat(( (site.Total-siteCounts.Total)/siteCounts.Total ) * 100).toFixed(2) + '%';
                        } else {
                           site.comparisons[comparisonName] = parseFloat((( (site.Total/reportDays) - (siteCounts.Total/comparisonDays)) / (siteCounts.Total/comparisonDays)) * 100).toFixed(2) + '%';
                        }

                        //NOTE: -100% will only happen if we added an item to the report just so we could get it in the total, so it doesn't need to factor.
                        if (site.comparisons[comparisonName] === 'Infinity%' || site.comparisons[comparisonName] === 'NaN%' || site.comparisons[comparisonName] === '-100.00%') {
                            site.comparisons[comparisonName] = 'N/A';
                        }

                        for (var ministry_name in counts[site_name].ministries) {
                            var ministryCounts = counts[site_name].ministries[ministry_name];
                            var ministry = counts[site_name].ministries[ministry_name].reportRef;

                            if (comparisonData.calculationType === 'vs_same') {
                                ministry.comparisons[comparisonName] = parseFloat(( (ministry.Total - ministryCounts.Total) / ministryCounts.Total  ) * 100).toFixed(2) + '%';
                            } else {
                               ministry.comparisons[comparisonName] = parseFloat((  ((ministry.Total / reportDays) - (ministryCounts.Total / comparisonDays) ) / (ministryCounts.Total / comparisonDays)) * 100).toFixed(2) + '%';
                            }
                            //NOTE: -100% will only happen if we added an item to the report just so we could get it in the total, so it doesn't need to factor.
                            if (ministry.comparisons[comparisonName] === 'Infinity%' || ministry.comparisons[comparisonName] === 'NaN%' || ministry.comparisons[comparisonName] === '-100.00%') {
                                ministry.comparisons[comparisonName] = 'N/A';
                            }
                        }
                    }

                    resolve();
                });
            });
        }

        function getNotesLike() {
            if (req.body.filter && req.body.filter.note && req.body.filter.note !== '') {
                return {
                    $like: req.body.filter.note + '%'
                }
            }

            return {
                $or: [
                    {$ne: 'THISISARANDOMVALUE_JUSTTOFILLIT'},
                    null
                ]
            };
        }

        function determineIncludes() {
            var includes = [{model: db.EntryType}];

            if (req.body.filter && req.body.filter.site && req.body.filter.site.length > 0) {
                includes.push({
                    model: db.Site,
                    where: {
                        site_name: req.body.filter.site
                    }
                });
            } else {
                includes.push({model: db.Site});
            }

            if (req.body.filter && req.body.filter.ministry && req.body.filter.ministry.length > 0) {
                includes.push({
                    model: db.Ministry,
                    where: {
                        ministry_name: req.body.filter.ministry
                    }
                });
            } else {
                includes.push({model: db.Ministry});
            }

            if (req.body.filter && req.body.filter.label && req.body.filter.label.length > 0) {
                includes.push({
                    model: db.Service,
                    where: {
                        service_name: req.body.filter.label
                    }
                });
            } else {
                includes.push({model: db.Service});
            }

            return includes;
        }
        var _MS_PER_DAY = 1000 * 60 * 60 * 24;
		function dateDiffInDays(a, b) {
            var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
            var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
            return Math.floor((utc2 - utc1) / _MS_PER_DAY);
        }
    });
};