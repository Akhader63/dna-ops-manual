SELECT 
  email,
  user_type,
  two_factor_enabled,
  two_factor_required,
  two_factor_secret IS NOT NULL as has_2fa_secret
FROM user_accounts
WHERE email = 'a.khader@dna.systems';
