# SES Module - Outputs
# Exports DNS records needed for domain verification and the domain identity ARN.

# -----------------------------------------------------------------------------
# Domain Identity
# -----------------------------------------------------------------------------

output "domain_identity_arn" {
  description = "ARN of the SES domain identity"
  value       = aws_ses_domain_identity.main.arn
}

output "domain_identity_verification_token" {
  description = "Verification token for the SES domain identity (TXT record value for _amazonses.domain)"
  value       = aws_ses_domain_identity.main.verification_token
}

# -----------------------------------------------------------------------------
# DNS Records Required for Verification
# -----------------------------------------------------------------------------

output "verification_dns_record" {
  description = "TXT DNS record for SES domain verification"
  value = {
    type  = "TXT"
    name  = "_amazonses.${var.domain}"
    value = aws_ses_domain_identity.main.verification_token
  }
}

output "dkim_dns_records" {
  description = "CNAME DNS records for DKIM verification (3 records)"
  value = [
    for token in aws_ses_domain_dkim.main.dkim_tokens : {
      type  = "CNAME"
      name  = "${token}._domainkey.${var.domain}"
      value = "${token}.dkim.amazonses.com"
    }
  ]
}

output "spf_dns_record" {
  description = "TXT DNS record for SPF on the custom MAIL FROM subdomain"
  value = {
    type  = "TXT"
    name  = local.mail_from_domain
    value = "v=spf1 include:amazonses.com ~all"
  }
}

output "mail_from_mx_record" {
  description = "MX DNS record for the custom MAIL FROM subdomain"
  value = {
    type     = "MX"
    name     = local.mail_from_domain
    value    = "10 feedback-smtp.${data.aws_region.current.name}.amazonses.com"
    priority = 10
  }
}

output "dmarc_dns_record" {
  description = "TXT DNS record for DMARC policy"
  value = {
    type  = "TXT"
    name  = "_dmarc.${var.domain}"
    value = local.dmarc_value
  }
}

# -----------------------------------------------------------------------------
# All DNS Records (consolidated for easy reference)
# -----------------------------------------------------------------------------

output "all_dns_records" {
  description = "All DNS records that must be added to the domain registrar for full SES verification"
  value = {
    ses_verification = {
      type  = "TXT"
      name  = "_amazonses.${var.domain}"
      value = aws_ses_domain_identity.main.verification_token
    }
    dkim = [
      for token in aws_ses_domain_dkim.main.dkim_tokens : {
        type  = "CNAME"
        name  = "${token}._domainkey.${var.domain}"
        value = "${token}.dkim.amazonses.com"
      }
    ]
    spf = {
      type  = "TXT"
      name  = local.mail_from_domain
      value = "v=spf1 include:amazonses.com ~all"
    }
    mail_from_mx = {
      type     = "MX"
      name     = local.mail_from_domain
      value    = "10 feedback-smtp.${data.aws_region.current.name}.amazonses.com"
      priority = 10
    }
    dmarc = {
      type  = "TXT"
      name  = "_dmarc.${var.domain}"
      value = local.dmarc_value
    }
  }
}

# -----------------------------------------------------------------------------
# Configuration Set
# -----------------------------------------------------------------------------

output "configuration_set_name" {
  description = "Name of the SES configuration set for email tracking"
  value       = aws_ses_configuration_set.main.name
}

# -----------------------------------------------------------------------------
# MAIL FROM Domain
# -----------------------------------------------------------------------------

output "mail_from_domain" {
  description = "Custom MAIL FROM domain configured for SPF alignment"
  value       = local.mail_from_domain
}
