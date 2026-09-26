# SES Module

Configures Amazon Simple Email Service (SES) for the Taskly application with domain identity verification, DKIM signing, SPF alignment, and DMARC policy.

## Requirements

- Requirement 6.2: Verified domain identity with SPF, DKIM, and DMARC records configured

## Usage

```hcl
module "ses" {
  source = "../../modules/ses"

  project     = "taskly"
  environment = "prod"
  domain      = "taskly.app"

  dmarc_policy    = "quarantine"
  dmarc_rua_email = "dmarc-reports@taskly.app"

  sending_authorized_principals = [
    module.iam.email_sender_role_arn
  ]

  tags = module.tags.common_tags
}
```

## DNS Records

After applying this module, you must add the DNS records output by `all_dns_records` to your domain registrar. The records include:

1. **SES Verification** - TXT record at `_amazonses.yourdomain.com`
2. **DKIM** - 3 CNAME records at `{token}._domainkey.yourdomain.com`
3. **SPF** - TXT record at `mail.yourdomain.com` (custom MAIL FROM subdomain)
4. **MAIL FROM MX** - MX record at `mail.yourdomain.com`
5. **DMARC** - TXT record at `_dmarc.yourdomain.com`

Run `terraform output -module=ses all_dns_records` to get the exact values after apply.

## Requesting Production Access (Moving Out of Sandbox)

By default, new SES accounts are placed in a **sandbox** environment with the following restrictions:

- Can only send to verified email addresses or domains
- Maximum sending rate of 1 email/second
- Maximum 200 emails per 24-hour period

To move to production and send to any recipient:

### Steps to Request Production Access

1. **Open the AWS SES Console** → Account Dashboard → "Request Production Access"

2. **Fill out the request form:**
   - **Mail type**: Transactional
   - **Website URL**: Your application URL (e.g., https://taskly.app)
   - **Use case description**: Explain your email use cases:
     ```
     Taskly is a project management application. We send transactional emails
     including: password reset codes, team invitation notifications, task
     assignment notifications, and notification digests. All emails are
     triggered by user actions. We do not send marketing or bulk emails.
     Recipients are registered users who have opted in by creating an account.
     ```
   - **Additional contacts**: Add a team email for bounce/complaint notifications
   - **Preferred AWS Region**: Same region as your infrastructure

3. **Compliance **
   - Implement bounce and complaint handling (this module configures CloudWatch event tracking)
   - Maintain bounce rate below 5% and complaint rate below 0.1%
   - Include unsubscribe links in notification digest emails
   - Honor suppression list (SES manages this automatically)

4. **After approval:**
   - Sending limits are raised (typically 50,000 emails/day initially)
   - You can send to any email address
   - Monitor your sending reputation via the SES console

### Timeline

- AWS typically reviews and approves production access requests within 24 hours
- If denied, they provide feedback on what to address before resubmitting

### Monitoring Sending Reputation

Once in production, monitor these metrics (tracked by the configuration set in this module):

- **Bounce rate**: Should stay below 5% (alarm threshold)
- **Complaint rate**: Should stay below 0.1%
- **Delivery rate**: Target 95%+

The CloudWatch event destination configured in this module publishes all delivery events for monitoring.

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| project | Project name for resource naming | string | "taskly" | no |
| environment | Deployment environment | string | - | yes |
| domain | Domain name for SES identity | string | - | yes |
| dmarc_policy | DMARC policy (none, quarantine, reject) | string | "quarantine" | no |
| dmarc_rua_email | Email for DMARC aggregate reports | string | "" | no |
| mail_from_subdomain | Subdomain for custom MAIL FROM | string | "mail" | no |
| sending_authorized_principals | ARNs authorized to send via this identity | list(string) | [] | no |
| tags | Common tags for resources | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| domain_identity_arn | ARN of the SES domain identity |
| domain_identity_verification_token | Verification token for TXT record |
| verification_dns_record | TXT record for SES verification |
| dkim_dns_records | 3 CNAME records for DKIM |
| spf_dns_record | TXT record for SPF |
| mail_from_mx_record | MX record for MAIL FROM |
| dmarc_dns_record | TXT record for DMARC |
| all_dns_records | All DNS records consolidated |
| configuration_set_name | Name of the SES configuration set |
| mail_from_domain | Custom MAIL FROM domain |
