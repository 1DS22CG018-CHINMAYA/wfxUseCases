Here is a detailed documentation of the conversation from the provided chat interface.

## **Overview**

The conversation centers on understanding how **UUID mapping** is handled when configured through **SSO (Single Sign-On)** in Whatfix, specifically addressing why certain functions fail to return the defined ID, how this impacts analytics capture, and how it fundamentally differs from an **Integration ID**.

---

## **Part 1: SSO-based UUID Mapping and Analytics**

**User Query:**
The user noticed that when mapping is done for a UUID via SSO, standard functions like `_wfx_app_user()` and `_wfx_settings.user` do not return the defined ID. However, the user information is successfully found in the local storage under the key `c1a0ab07-46fa-40cb-8c78-da91c71a65f8_sso_attributes`. The user asked how this mapping works and how to ensure it doesn't affect analytics capture.

### **How SSO-based UUID Mapping Works**

1. **SAML Response & Attribute Capture:** During the end-user authentication flow, attributes are captured from the SAML response sent by the Identity Provider (IdP). This mapping is configured in the Dashboard under *Settings → End-user authentication*.
2. **Local Storage Execution:** The mapped attributes are intentionally saved in the host application's local storage (e.g., `{ent_id}_sso_attributes`). These attributes are used for content segmentation and are accessible via `_wfx_data.sso_attributes.attribute_map.<attribute_key>`. [End User Attribute Capturing](https://whatfix.atlassian.net/wiki/spaces/EN/pages/2808447095/End+User+Attribute+Capturing)
3. **Why Standard Functions Return Empty:** It is completely expected that `_wfx_app_user()` and `_wfx_settings.user` do not show the SSO ID. SSO-based identification uses a separate **Monitor ID** detection path. When enabled, it bypasses the **Integration ID** path that those standard functions rely on. [User Identification playbook](https://whatfix.atlassian.net/wiki/spaces/EN/pages/2185429351/User+Identification+playbook)

### **Ensuring Seamless Analytics Capture**

To guarantee that the SSO-based UUID is accurately captured in analytics, specific configurations must be verified:

* **Enable Feature Flag:** The `enduser_auth_analytics` flag must be enabled; otherwise, the SSO user ID won't pass to analytics events. [Enable User Identification via SSO](https://whatfix.atlassian.net/wiki/spaces/SD/pages/2197784325/Enable+User+Identification+via+SSO)
* **Enable "via SSO" Property:** Under *Monitor → Integration Settings → Configure End User Properties*, the **via SSO** checkbox must be enabled. *Note: Doing this disables all other detection methods.* [End User Detection via SSO (End User Authentication)](https://whatfix.atlassian.net/wiki/spaces/EN/pages/2144600800/End+User+Detection+via+SSO+End+User+Authentication)
* **Enable User Unification:** The `analytics_unify_users` flag must be active to merge anonymous cookie events (from the first login before authentication completes) with the resolved SSO user ID. [Understanding User Identification and Unification](https://whatfix.atlassian.net/wiki/spaces/PA/pages/3123118149/Understanding+User+Identification+and+Unification)
* **Data Passing:** Attribute data must be pushed to ClickHouse along with capture calls for insights filtering to work properly.

*Note:* A known issue exists ([SUCC-36538: Discrepancy in UUID capture - SSO Attributes CLOSED](https://whatfix.atlassian.net/browse/SUCC-36538)) where discrepancies sometimes occur, such as capturing an email instead of a UUID, or a custom attribute appearing empty.

---

## **Part 2: Integration ID vs. SSO-based UUID**

**User Follow-Up Query:**
The user asked for the definition of an **Integration ID** and how it differs from the UUID integration configured through SSO.

### **What is an Integration ID?**

An **Integration ID** is a user identifier derived by reading attributes straight from the host application's client-side layer (like window variables, cookies, or DOM elements).

* **Configuration:** Done either via the Dashboard UI (*Settings → Advanced Configuration → Set User*) or via Advanced Customization (AC) code by manually setting `_wfx_settings.user`. [Create Custom User Identification Rules on Whatfix Dashboard](https://whatfix.atlassian.net/wiki/spaces/SD/pages/2424143916/Create+Custom+User+Identification+Rules+on+Whatfix+Dashboard)
* **Storage:** Saved in local storage under `{ent_id}_wfx_app_user_name_integration`.
* **Priority:** It holds the **highest priority** among all user ID types and overrides any other ID if available.

### **Key Differences: Integration ID vs. SSO-based UUID**

| Aspect | Integration ID | SSO-based UUID (Monitor ID) |
| --- | --- | --- |
| **Source** | Host app's JS layer (window vars, cookies, local storage) | SAML response from Identity Provider |
| **How it's set** | `_wfx_settings.user = value` (AC code) or UI Rules | Automatically via SSO auth response |
| **Where it's stored** | `{ent_id}_wfx_app_user_name_integration` (Local Storage) | `{ent_id}_sso_attributes` (Local Storage) |
| **Configuration** | Dashboard → Advanced Config or AC code | Monitor → Integration Settings → Enable "via SSO" |
| **Priority** | **Highest** (Overrides all others) | Lower than Integration, but disables other paths when active |
| **Runtime Access** | `_wfx_app_user()` or `_wfx_settings.user` | `_wfx_data.sso_attributes.attribute_map.<key>` |
| **Analytics Flag** | Captured by default | Requires `enduser_auth_analytics` |
| **Best Use Case** | Apps exposing user info in the JS layer requiring custom formatting | Apps using SSO where IdP attributes serve both auth and ID |

### **The Critical Takeaway: Mutual Exclusivity**

The most important operational note is that **enabling "via SSO" detection entirely disables the Integration ID and Monitor ID detection paths.** They cannot run concurrently.

* If **SSO** is ON, `_wfx_settings.user` and `_wfx_app_user()` will be empty.
* If **Integration ID** is ON, SSO attributes can still be captured for segmentation, but analytics will use the Integration ID.