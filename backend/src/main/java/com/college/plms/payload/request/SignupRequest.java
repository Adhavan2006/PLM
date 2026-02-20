package com.college.plms.payload.request;

import jakarta.validation.constraints.*;

public class SignupRequest {
    @NotBlank
    @Size(max = 50)
    @Email
    private String email;
    
    @NotBlank
    private String fullName;
    
    @NotBlank
    @Size(min = 6, max = 40)
    private String password;

    @NotBlank
    private String confirmPassword;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
}
