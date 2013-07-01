require "rubygems"
require "csv"

outfile = File.open("outpatient.sql", 'w')

CSV.foreach("../orig/Medicare_Provider_Charge_Outpatient_APC30_CY2011.csv") do |row|
  apc_info, providerId, providerName, providerStreetAddress, providerCity, providerState, providerZipCode,
  hospitalReferralRegionDescription, outpatientServices, averageEstimatedSubmittedCharges,
  averageTotalPayments  = row

  outfile.write("INSERT INTO outpatient (apcID, providerID, outpatientServices, avgEstSubmittedChg, avgTotalPayments) SELECT " +
    " a.id, p.id, " + outpatientServices + ", " + averageEstimatedSubmittedCharges + ", " + averageTotalPayments + 
    " FROM ambClass a " +
    " INNER JOIN provider p ON p.national_id = " + providerId + 
    " WHERE a.code = " + apc_info[0,4] + ";")

  outfile.write("\n")

end

outfile.close