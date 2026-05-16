const handle2FACancel = () => {
    setShow2FAModal(false);
    setTwoFactorCode('');
    setTwoFactorError(null);
    // Note: pendingUserId is managed by useAuth
  };
