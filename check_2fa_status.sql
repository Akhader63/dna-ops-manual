SELECT 
  id,
  email,
  full_name,
  user_type,
  two_factor_enabled,
  two_factor_required,
  two_factor_configured_at,
  two_factor_secret IS NOT NULL as has_secret
FROM user_accounts
WHERE email = 'a.khader@dna.systems';
