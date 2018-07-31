var cache = null;

module.exports = function() {
    if (cache) {
        return cache;
    }

    var Sequelize = require('sequelize');
    var sequelize;
    
    if (process.env.NODE_ENV === 'prod') {
        if (process.env.DB_HOST !== '') {
			//alert('SQL Server');
            sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
                host: process.env.DB_HOST,
                dialect: 'mssql'
            });
        } else {
			//alert('MySQL');
            sequelize = new Sequelize('attendance', 'root', '', {
                host: 'localhost',
                dialect: 'mysql'
            });
        }
    } else {
        sequelize = new Sequelize('attendance-tracker', 'testUser', 'testing', {
            host: 'localhost',
            dialect: 'mssql'
        });
    }
    sequelize.sync().then(function(){
        console.log('DB connection successful.');
      }, function(err){
        // catch error here
        console.error('DB connection error.');
        console.error(err);
      
      });


    var User = sequelize.define((process.env.TABLE_PREFIX_USER || '') + 'user', {
        user_id: {
            allowNull: true,
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ministry_platform_id: Sequelize.INTEGER,
        first_name: Sequelize.STRING,
        last_name: Sequelize.STRING,
        email: Sequelize.STRING,
        first_active: Sequelize.DATE,
        last_active: Sequelize.DATE
    }, {
        timestamps: false,
        freezeTableName: true
    });

    var Site = sequelize.define((process.env.TABLE_PREFIX_SITE || '') + 'site', {
        site_id: {
            allowNull: true,
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        site_name: Sequelize.STRING,
        cameras_main_entrance: Sequelize.BOOLEAN,
        mp_congregation_id: Sequelize.INTEGER,
        display_order: Sequelize.INTEGER,
        start_time_offset: Sequelize.INTEGER,
        end_time_offset: Sequelize.INTEGER
    }, {
        timestamps: false,
        freezeTableName: true
    });

    var Service = sequelize.define((process.env.TABLE_PREFIX_SERVICE || '') + 'service', {
        service_id: {
            allowNull: true,
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        service_name: Sequelize.STRING,
        service_group: Sequelize.STRING,
        display_order: Sequelize.INTEGER
    }, {
        timestamps: false,
        freezeTableName: true
    });

    var Ministry = sequelize.define((process.env.TABLE_PREFIX_MINISTRY || '') + 'ministry', {
        ministry_id: {
            allowNull: true,
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ministry_name: Sequelize.STRING,
        display_order: Sequelize.INTEGER
    }, {
        timestamps: false,
        freezeTableName: true
    });

    var EntryType = sequelize.define((process.env.TABLE_PREFIX_ENTRY_TYPE || '') + 'entry_type', {
        entry_type_id: {
            allowNull: true,
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        entry_type_name: Sequelize.STRING,
        display_order: Sequelize.INTEGER
    }, {
        timestamps: false,
        freezeTableName: true
    });

    var ServiceInstance = sequelize.define((process.env.TABLE_PREFIX_SERVICE_INSTANCE || '') + 'service_instance', {
        service_instance_id: {
            allowNull: true,
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        service_instance_map_id: Sequelize.INTEGER,
        created_user_id: Sequelize.INTEGER,
        created_date: Sequelize.DATE,
        edited_user_id: Sequelize.INTEGER,
        edited_date: Sequelize.DATE,
        site_id: {
            type: Sequelize.INTEGER,
            reference: {
                model: Site,
                key: 'site_id'
            }
        },
        ministry_id: {
            type: Sequelize.INTEGER,
            reference: {
                model: Ministry,
                key: 'ministry_id'
            }
        },
        service_id: {
            type: Sequelize.INTEGER,
            reference: {
                model: Service,
                key: 'service_id'
            }
        },
        date_of_service: Sequelize.DATE,
        entry_type_id: {
            type: Sequelize.INTEGER,
            reference: {
                model: EntryType,
                key: 'entry_type_id'
            }
        },
        entry_value: Sequelize.STRING,
        notes: Sequelize.STRING
    }, {
        timestamps: false,
        freezeTableName: true
    });
    ServiceInstance.belongsTo(EntryType, {foreignKey: 'entry_type_id'});
    ServiceInstance.belongsTo(Site, {foreignKey: 'site_id'});
    ServiceInstance.belongsTo(Ministry, {foreignKey: 'ministry_id'});
    ServiceInstance.belongsTo(Service, {foreignKey: 'service_id'});

    var ReportHash = sequelize.define((process.env.TABLE_PREFIX_REPORT_HASH || '') + 'report_hash', {
        report_hash_id: {
            allowNull: true,
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        created_user_id: Sequelize.INTEGER,
        created_date: Sequelize.DATE,
        hash: Sequelize.STRING,
        report_parameters: Sequelize.TEXT
    }, {
        timestamps: false,
        freezeTableName: true
    });

    User.sync();
    Site.sync();
    Service.sync();
    Ministry.sync();
    EntryType.sync();
    ServiceInstance.sync();
    ReportHash.sync();

    cache =  {
        User: User,
        Site: Site,
        Service: Service,
        Ministry: Ministry,
        EntryType: EntryType,
        ServiceInstance: ServiceInstance,
        sequelize: sequelize,
        ReportHash: ReportHash
    };

    return cache
};
