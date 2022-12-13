import { t, Trans } from "@lingui/macro";
import { FormField } from "components/field";
import { Box, BoxProps, Text } from "theme-ui";
import { isAddress } from "utils";

/**
 * View: Deploy -> Token setup
 */
const TokenForm = (props: BoxProps) => (
    <Box {...props}>
        <Box variant="layout.verticalAlign" mb={4}>
            <Text ml={2} variant="title">
                <Trans>ETF Details</Trans>
            </Text>
        </Box>
        <FormField
            label={t`ETF name`}
            placeholder={t`Input token name`}
            mb={3}
            name="name"
            options={{
                required: t`Token name required`,
            }}
        />
        <FormField
            label={t`ETF symbol`}
            placeholder={t`Input symbol`}
            mb={3}
            name="ticker"
            options={{
                required: t`ETF symbol is required`,
            }}
        />

        <FormField
            label={t`Ownership address`}
            placeholder={t`Ownership address`}
            name="ownerAddress"
            disabled
            options={{
                required: t`ETF owner address is required`,
                validate: (value) => !!isAddress(value) || t`Invalid address`,
            }}
        />
    </Box>
);

export default TokenForm;
