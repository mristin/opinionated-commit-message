#!/usr/bin/env pwsh

<#
.SYNOPSIS
Runs the integration tests.
#>

function WriteExpectedGot([string]$expected, [string]$got)
{
    Write-Host "--- Expected: ---"
    Write-Host $($expected|ConvertTo-Json)
    Write-Host "--- Got: ---"
    Write-Host $($got|ConvertTo-Json)
}

function TestFailTooFewLines
{
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message "Do something" -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "* Expected at least three lines (subject, empty, body), but got: 1${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestFailTooFewLines: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestFailTooFewLines: OK"
}

function TestFailSubjectWithNonVerb
{
    $message = "ABC does something`n`nThis patch does something."
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "* The subject must start with a capitalized verb (e.g., `"Change`").${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestFailSubjectWithNonVerb: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestFailSubjectWithNonVerb: OK"
    return $true
}

function TestFailSubjectWithTrailingDot
{
    $message = "Do something.`n`nThis patch does something."
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "* The subject must not end with a dot ('.').${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestFailSubjectWithTrailingDot: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }
    Write-Host "TestFailSubjectWithTrailingDot: OK"
    return $true
}

function TestFailSubjectTooLong
{
    $subject = "A" * 51
    $message = "${subject}`n`nThis patch does something."
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "* The subject exceeds the limit of 50 characters " + `
        "(got: 51): `"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`"${nl}" + `
        "* The subject must start with a capitalized verb (e.g., `"Change`").${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestFailSubjectTooLong: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestFailSubjectTooLong: OK"
    return $true
}

function TestFailBodyTooLong
{
    $bodyLine = "A" * 73
    $message = "Do something`n`n${bodyLine}"
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "* The line 3 of the message (line 1 of the body) exceeds the limit of 72 characters. " + `
        "The line contains 73 characters: `"${bodyLine}`".${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestFailBodyTooLong: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestFailBodyTooLong: OK"
    return $true
}

function TestFailIdenticalFirstWordInBodyAndSubject
{
    $message = "Do something`n`nDo something!"
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "* The first word of the subject (`"Do`") must not match the first word of the body.${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestFailIdenticalFirstWordInBodyAndSubject: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestFailIdenticalFirstWordInBodyAndSubject: OK"
    return $true
}

function TestOK
{
    $message = "Do something`n`nThis patch does something."
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "The message is OK.${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestOK: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestOK: OK"
    return $true
}

function TestOKCarriageReturn
{
    $trail = "a" * 47
    $bodyLine = "b" * 72
    $message = "Do ${trail}`r`n`n$bodyLine`r`n"
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "The message is OK.${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestOKCarriageReturn: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestOKCarriageReturn: OK"
    return $true
}

function TestOKMergeBranch
{
    $message = "Merge branch 'V20DataModel' into miho/Conform-to-spec"
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "The message is OK.${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestOKMergeBranch: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestOKMergeBranch: OK"
    return $true
}

function TestOKAdditionalVerbs
{
    $message = "Munzekonza something`n`nThis patch does something."
    $got = (powershell `
        -File OpinionatedCommitMessage.ps1 `
        -message $message `
        -additionalVerbs "munzekonza, zemun" `
        -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "The message is OK.${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestOKAdditionalVerbs: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestOKAdditionalVerbs: OK"
    return $true
}

function TestOKPathToAdditionalVerbs
{
    $tmp = New-TemporaryFile

    try
    {
        "zemun`r`nmunzekonza" | Out-File $tmp.FullName

        $message = "Munzekonza something`n`nThis patch does something."
        $got = (powershell `
            -File OpinionatedCommitMessage.ps1 `
            -message $message `
            -pathToAdditionalVerbs $tmp.FullName `
            -dontThrow)|Out-String

        $nl = [Environment]::NewLine
        $expected = "The message is OK.${nl}"

        if ($got -ne $expected)
        {
            Write-Host "TestOKPathToAdditionalVerbs: FAILED"
            WriteExpectedGot -expected $expected -got $got
            return $false
        }

        Write-Host "TestOKPathToAdditionalVerbs: OK"
        return $true
    }
    finally
    {
        Remove-Item $tmp.FullName -Force
    }
}

function TestOKWithAllowOneLiners
{
    $message = "Do something"
    $got = (powershell `
        -File OpinionatedCommitMessage.ps1 `
        -message $message `
        -allowOneLiners `
        -dontThrow
    )|Out-String

    $nl = [Environment]::NewLine
    $expected = "The message is OK.${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestOKWithAllowOneLiners: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestOKWithAllowOneLiners: OK"
    return $true
}

function TestFailWithAllowOneLiners
{
    $message = "Do something."
    $got = (powershell `
        -File OpinionatedCommitMessage.ps1 `
        -message $message `
        -allowOneLiners `
        -dontThrow
    )|Out-String

    $nl = [Environment]::NewLine
    $expected = "* The subject must not end with a dot ('.').${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestFailWithAllowOneLiners: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestFailWithAllowOneLiners: OK"
    return $true
}

function Main
{
    Push-Location
    Set-Location $PSScriptRoot

    try
    {
        $success = TestFailTooFewLines
        $success = TestFailSubjectWithNonVerb -and $success
        $success = TestFailSubjectWithTrailingDot -and $success
        $success = TestFailSubjectTooLong -and $success
        $success = TestFailBodyTooLong -and $success
        $success = TestFailIdenticalFirstWordInBodyAndSubject -and $success
        $success = TestOK -and $success
        $success = TestOKMergeBranch -and $success
        $success = TestOKCarriageReturn -and $success
        $success = TestOKAdditionalVerbs -and $success
        $success = TestOKPathToAdditionalVerbs -and $success
        $success = TestOKWithAllowOneLiners -and $success
        $success = TestFailWithAllowOneLiners -and $success

        # TODO: TestFailAllowOneLiners

        if(!$success)
        {
            throw "One or more unit tests failed."
        }
    }
    finally
    {
        Pop-Location
    }
}

Main
