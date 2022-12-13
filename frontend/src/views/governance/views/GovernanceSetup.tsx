import { t, Trans } from "@lingui/macro";
import { Container } from "components";
import { SmallButton } from "components/button";
import { useFormContext } from "react-hook-form";
import { Box, Card, Grid, Text } from "theme-ui";
import DeployHeader from "../../deploy/components/DeployHeader";
import DeploymentStepTracker, { Steps } from "../../deploy/components/DeployStep";
import GovernanceForm from "../components/GovernanceForm";

const GovernanceSetup = () => {
    const {
        formState: { isValid },
    } = useFormContext();

    return (
        <>
            <DeploymentStepTracker step={Steps.GovernanceSetup} />
            <Container mt={-4}>
                <DeployHeader
                    isValid={isValid}
                    title={t`Define Governance`}
                    subtitle={t`Define account roles and governance configuration`}
                    confirmText={t`Confirm governance setup`}
                />
                <Card p={2}>
                    <Box sx={{ borderRight: "1px solid", borderColor: "border" }} my={5} px={5}>
                        <GovernanceForm />
                    </Box>
                </Card>
            </Container>
        </>
    );
};

export default GovernanceSetup;
