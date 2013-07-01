/*national, all drgs */
SELECT p.state, ROUND(avg(i.averageCoveredCharges)) averageCoveredCharges, ROUND(avg(i.averagePayments)) averagePayments
FROM provider p
INNER JOIN inpatient i ON i.providerID = p.id
group by p.state

/*national, selected drg */
SELECT p.state, ROUND(avg(i.averageCoveredCharges)) averageCoveredCharges, ROUND(avg(i.averagePayments)) averagePayments
FROM provider p
INNER JOIN inpatient i ON i.providerID = p.id
INNER JOIN diagnosis d ON i.drgid = d.id
WHERE d.description = 'CERVICAL SPINAL FUSION W/O CC/MCC'
group by p.state

/*state, all drgs */
SELECT p.city, ROUND(avg(i.averageCoveredCharges)) averageCoveredCharges, ROUND(avg(i.averagePayments)) averagePayments
FROM provider p
INNER JOIN inpatient i ON i.providerID = p.id
WHERE p.state = 'AZ'
group by p.city

/*state, selected drg*/
SELECT p.city, ROUND(avg(i.averageCoveredCharges)) averageCoveredCharges, ROUND(avg(i.averagePayments)) averagePayments
FROM provider p
INNER JOIN inpatient i ON i.providerID = p.id
INNER JOIN diagnosis d ON i.drgid = d.id
WHERE d.description = 'CERVICAL SPINAL FUSION W/O CC/MCC' AND p.state = 'AZ'
group by p.city

/*city, all drgs*/
SELECT p.name, p.national_id, ROUND(avg(i.averageCoveredCharges)) averageCoveredCharges, ROUND(avg(i.averagePayments)) averagePayments
FROM provider p
INNER JOIN inpatient i ON i.providerID = p.id
WHERE p.state = 'AZ' AND p.city = 'PHOENIX'
group by p.name

/*city, selected drg*/
SELECT p.name, ROUND(avg(i.averageCoveredCharges)) averageCoveredCharges, ROUND(avg(i.averagePayments)) averagePayments
FROM provider p
INNER JOIN inpatient i ON i.providerID = p.id
INNER JOIN diagnosis d ON i.drgid = d.id
WHERE d.description = 'CERVICAL SPINAL FUSION W/O CC/MCC' AND p.state = 'AZ' AND p.city = 'PHOENIX'
group by p.name

/*provider, all drgs*/
SELECT d.description, ROUND(avg(i.averageCoveredCharges)) averageCoveredCharges, ROUND(avg(i.averagePayments)) averagePayments
FROM provider p
INNER JOIN inpatient i ON i.providerID = p.id
INNER JOIN diagnosis d ON i.drgid = d.id
WHERE p.state = 'AZ' AND p.city = 'PHOENIX' AND p.national_id = '30024'/*p.name = 'ST JOSEPH\'S HOSPITAL AND MEDICAL CENTER'*/
group by d.description

